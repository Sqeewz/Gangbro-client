use crate::domain::{
    entities::crew_memberships::CrewMembershipEntity,
    repositories::{
        crew_operation::CrewOperationRepository, mission_viewing::MissionViewingRepository,
    },
    value_objects::mission_statuses::MissionStatuses,
};
use crate::infrastructure::notifications::broadcaster::GlobalBroadcaster;
use serde_json::json;

use anyhow::Result;
use std::sync::Arc;

pub struct CrewOperationUseCase<T1, T2>
where
    T1: CrewOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
{
    crew_operation_repository: Arc<T1>,
    mission_viewing_repository: Arc<T2>,
    broadcaster: Arc<GlobalBroadcaster>,
}

impl<T1, T2> CrewOperationUseCase<T1, T2>
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync,
{
    pub fn new(crew_operation_repository: Arc<T1>, mission_viewing_repository: Arc<T2>, broadcaster: Arc<GlobalBroadcaster>) -> Self {
        Self {
            crew_operation_repository,
            mission_viewing_repository,
            broadcaster,
        }
    }

    pub async fn join(&self, mission_id: i32, brawler_id: i32, allow_bypass: bool) -> Result<()> {
        let max_crew_per_mission = std::env::var("MAX_CREW_PER_MISSION")
            .expect("missing value")
            .trim()
            .parse()?;

        let mission = self.mission_viewing_repository.get_one(mission_id).await?;

        if !allow_bypass && mission.chief_id == brawler_id {
            return Err(anyhow::anyhow!(
                "Chiefs cannot join their own missions as crew members"
            ));
        }

        let crew_count = self
            .mission_viewing_repository
            .crew_counting(mission_id)
            .await?;

        let mission_status_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string();
        if !mission_status_condition {
            return Err(anyhow::anyhow!("Mission is not joinable"));
        }
        let crew_count_condition = crew_count < max_crew_per_mission;
        if !crew_count_condition {
            return Err(anyhow::anyhow!("Mission is full"));
        }

        self.crew_operation_repository
            .join(CrewMembershipEntity {
                mission_id,
                brawler_id,
            }, allow_bypass)
            .await?;

        self.broadcaster.broadcast(json!({
            "type": "crew_movement",
            "mission_id": mission_id,
            "message": format!("New brawler joined mission \"{}\"", mission.name)
        }));

        Ok(())
    }

    pub async fn leave(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.get_one(mission_id).await?;

        let leaving_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string();
        if !leaving_condition {
            return Err(anyhow::anyhow!("Mission is not leavable"));
        }
        self.crew_operation_repository
            .leave(CrewMembershipEntity {
                mission_id,
                brawler_id,
            })
            .await?;

        self.broadcaster.broadcast(json!({
            "type": "crew_movement",
            "mission_id": mission_id,
            "message": format!("A brawler left mission \"{}\"", mission.name)
        }));

        Ok(())
    }
}