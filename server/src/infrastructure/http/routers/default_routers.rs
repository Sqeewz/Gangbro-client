use axum::{Json, Router, extract::Path, http::StatusCode, response::IntoResponse, routing::get};
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({ "status": "ok", "message": "All Right, I'm Good" }))).into_response()
}

pub async fn make_error(Path(code): Path<u16>) -> impl IntoResponse {
    let status_code = StatusCode::from_u16(code).unwrap();
    (status_code, Json(json!({ "error": format!("Error code: {}", code) }))).into_response()
}

pub fn routes() -> Router {
    Router::new()
        .route("/make-error/{code}", get(make_error))
        .route("/health-check", get(health_check))
}