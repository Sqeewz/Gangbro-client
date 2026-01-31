use std::sync::Arc;

use axum::{Extension, Json, Router, extract::{Path, State}, http::StatusCode, response::IntoResponse, routing::{delete, post}};
use serde_json::json;

use crate::{application::use_cases::crew_operation::CrewOperationUseCase, domain::repositories::{crew_operation::CrewOperationRepository, mission_viewing::MissionViewingRepository}, infrastructure::{database::{postgresql_connection::PgPoolSquad, repositories::{crew_operation::CrewOperationPostgres, mission_viewing::MissionViewingPostgres}}, http::middleware::auth::authorization, notifications::broadcaster::GlobalBroadcaster}};

pub async fn join<T1, T2>(
    State(crew_operation_use_case): State<Arc<CrewOperationUseCase<T1, T2>>>,
    Extension(brawler_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync,
{
    match crew_operation_use_case.join(mission_id, brawler_id, false).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "message": format!("Brawler({}) join Mission({})", brawler_id, mission_id)
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn leave<T1, T2>( 
    State(crew_operation_use_case): State<Arc<CrewOperationUseCase<T1, T2>>>,
    Extension(brawler_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync,
{

    match crew_operation_use_case.leave(mission_id, brawler_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "message": format!("Brawler({}) has leaved Mission({})", brawler_id, mission_id)
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
            .into_response(),
    }

}

pub fn routes(db_pool: Arc<PgPoolSquad>, broadcaster: Arc<GlobalBroadcaster>) -> Router {
    let crew_operation_repository = CrewOperationPostgres::new(Arc::clone(&db_pool));
    let mission_viewing_repository = MissionViewingPostgres::new(Arc::clone(&db_pool));

    let use_case = CrewOperationUseCase::new(
        Arc::new(crew_operation_repository),
        Arc::new(mission_viewing_repository),
        broadcaster,
    );

    Router::new()
        .route("/join/{mission_id}", post(join))
        .route("/leave/{mission_id}", delete(leave))
        .route_layer(axum::middleware::from_fn(authorization))
        .with_state(Arc::new(use_case))
}

