use std::sync::Arc;
use axum::{
    extract::{Path, State, ws::{WebSocket, WebSocketUpgrade}},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use serde_json::json;

use crate::{
    application::use_cases::mission_chat::MissionChatUseCase,
    domain::{
        repositories::mission_chat::MissionChatRepository,
        value_objects::mission_chat_model::{AddMissionChatModel},
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad, repositories::mission_chat::MissionChatPostgres,
        },
        http::middleware::auth::authorization,
    },
};

pub struct MissionChatState<T>
where
    T: MissionChatRepository + Send + Sync,
{
    pub use_case: MissionChatUseCase<T>,
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repo = MissionChatPostgres::new(db_pool);
    let use_case = MissionChatUseCase::new(Arc::new(repo));

    let state = Arc::new(MissionChatState {
        use_case,
    });

    Router::new()
        .route("/{mission_id}", 
            get(get_messages)
            .post(add_message)
            .layer(axum::middleware::from_fn(authorization))
        )
        .route("/ws/{mission_id}", get(ws_handler))
        .with_state(state)
}

async fn ws_handler<T>(
    ws: WebSocketUpgrade,
    Path(mission_id): Path<i32>,
    State(state): State<Arc<MissionChatState<T>>>,
) -> impl IntoResponse
where
    T: MissionChatRepository + Send + Sync + 'static,
{
    ws.on_upgrade(move |socket| handle_socket(socket, mission_id, state))
}

async fn handle_socket<T>(
    mut _socket: WebSocket,
    mission_id: i32,
    state: Arc<MissionChatState<T>>,
) where
    T: MissionChatRepository + Send + Sync,
{
    tracing::info!("[WS] New connection for mission {}", mission_id);
    
    // Initial data: send current messages right away
    if let Ok(messages) = state.use_case.get_messages(mission_id).await {
        if let Ok(msg_text) = serde_json::to_string(&messages) {
            let _ = _socket.send(axum::extract::ws::Message::Text(msg_text.into())).await;
        }
    }

    // Listener loop to keep connection alive
    while let Some(Ok(msg)) = _socket.recv().await {
        if let axum::extract::ws::Message::Close(_) = msg {
            break;
        }
    }
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
        Err(e) => {
            tracing::error!("Failed to get messages: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            ).into_response()
        }
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
        Ok(_) => {
            (StatusCode::CREATED, Json(json!({ "status": "sent" }))).into_response()
        },
        Err(e) => {
            tracing::error!("Failed to add message: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            ).into_response()
        }
    }
}
