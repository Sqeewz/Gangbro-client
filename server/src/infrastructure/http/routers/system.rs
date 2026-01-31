use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::get, Json, Router};
use std::sync::Arc;
use crate::{
    application::use_cases::system::SystemUseCase,
    domain::repositories::system::SystemRepository,
};

pub struct SystemState<T: SystemRepository> {
    pub use_case: SystemUseCase<T>,
}

pub fn routes<T>(repo: T) -> Router 
where 
    T: SystemRepository + Send + Sync + 'static,
{
    let state = Arc::new(SystemState {
        use_case: SystemUseCase::new(repo),
    });

    Router::new()
        .route("/stats", get(get_stats))
        .with_state(state)
}

async fn get_stats<T>(
    State(state): State<Arc<SystemState<T>>>,
) -> impl IntoResponse
where
    T: SystemRepository + Send + Sync,
{
    match state.use_case.get_stats().await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        ).into_response(),
    }
}
