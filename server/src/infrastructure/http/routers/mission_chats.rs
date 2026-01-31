use std::sync::Arc;
use axum::{
    extract::{Path, State, Query, ws::{Message, WebSocket, WebSocketUpgrade}},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use serde::{Deserialize};
use serde_json::json;
use tokio::sync::broadcast;
use dashmap::DashMap;
use futures_util::{sink::SinkExt, stream::StreamExt};

use crate::{
    application::use_cases::mission_chat::MissionChatUseCase,
    domain::{
        repositories::mission_chat::MissionChatRepository,
        value_objects::mission_chat_model::{AddMissionChatModel, MissionChatModel},
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad, repositories::mission_chat::MissionChatPostgres,
        },
        http::middleware::auth::authorization,
    },
};

pub struct ChatBroadcaster {
    pub channels: DashMap<i32, broadcast::Sender<MissionChatModel>>,
}

impl ChatBroadcaster {
    pub fn new() -> Self {
        Self {
            channels: DashMap::new(),
        }
    }

    pub fn get_sender(&self, mission_id: i32) -> broadcast::Sender<MissionChatModel> {
        self.channels
            .entry(mission_id)
            .or_insert_with(|| {
                let (tx, _) = broadcast::channel(100);
                tx
            })
            .clone()
    }
}

pub struct MissionChatState<T>
where
    T: MissionChatRepository + Send + Sync,
{
    pub use_case: MissionChatUseCase<T>,
    pub broadcaster: Arc<ChatBroadcaster>,
}

#[derive(Deserialize)]
pub struct WsParams {
    pub token: Option<String>,
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repo = MissionChatPostgres::new(db_pool);
    let use_case = MissionChatUseCase::new(Arc::new(repo));
    let broadcaster = Arc::new(ChatBroadcaster::new());

    let state = Arc::new(MissionChatState {
        use_case,
        broadcaster,
    });

    Router::new()
        .route("/{mission_id}", get(get_messages).layer(axum::middleware::from_fn(authorization)))
        .route("/{mission_id}", post(add_message).layer(axum::middleware::from_fn(authorization)))
        .route("/ws/{mission_id}", get(ws_handler))
        .with_state(state)
}

async fn get_messages<T>(
    State(state): State<Arc<MissionChatState<T>>>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T: MissionChatRepository + Send + Sync,
{
    match state.use_case.get_messages(mission_id).await {
        Ok(messages) => (StatusCode::OK, Json(messages)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn add_message<T>(
    State(state): State<Arc<MissionChatState<T>>>,
    Extension(brawler_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(payload): Json<AddMissionChatModel>,
) -> impl IntoResponse
where
    T: MissionChatRepository + Send + Sync,
{
    match state.use_case.add_message(mission_id, brawler_id, &payload.message).await {
        Ok(chat_model) => {
            // Broadcast the message
            let tx = state.broadcaster.get_sender(mission_id);
            let _ = tx.send(chat_model);
            
            (StatusCode::CREATED, Json(json!({ "status": "sent" }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn ws_handler<T>(
    ws: WebSocketUpgrade,
    State(state): State<Arc<MissionChatState<T>>>,
    Path(mission_id): Path<i32>,
    Query(_params): Query<WsParams>,
) -> impl IntoResponse
where
    T: MissionChatRepository + Send + Sync + 'static,
{
    // Optional: Validate token here if provided in query
    // For now we just upgrade
    ws.on_upgrade(move |socket| handle_socket(socket, state, mission_id))
}

async fn handle_socket<T>(
    socket: WebSocket,
    state: Arc<MissionChatState<T>>,
    mission_id: i32,
) where
    T: MissionChatRepository + Send + Sync + 'static,
{
    let (mut sender, mut _receiver) = socket.split();
    
    let tx = state.broadcaster.get_sender(mission_id);
    let mut rx = tx.subscribe();

    // Task to send messages from broadcast channel to WebSocket
    tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let msg_json = serde_json::to_string(&msg).unwrap();
            if sender.send(Message::Text(msg_json.into())).await.is_err() {
                break;
            }
        }
    });
}
