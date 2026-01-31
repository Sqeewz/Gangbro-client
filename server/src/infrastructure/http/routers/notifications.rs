use std::sync::Arc;
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use crate::infrastructure::notifications::broadcaster::GlobalBroadcaster;

pub fn routes(broadcaster: Arc<GlobalBroadcaster>) -> Router {
    Router::new()
        .route("/ws", get(ws_handler))
        .with_state(broadcaster)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(broadcaster): State<Arc<GlobalBroadcaster>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, broadcaster))
}

async fn handle_socket(socket: WebSocket, broadcaster: Arc<GlobalBroadcaster>) {
    let (mut sender, mut _receiver) = socket.split();
    let mut rx = broadcaster.tx.subscribe();

    while let Ok(msg) = rx.recv().await {
        if sender.send(Message::Text(msg.to_string().into())).await.is_err() {
            break;
        }
    }
}
