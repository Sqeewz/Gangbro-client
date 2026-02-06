use std::sync::Arc;

use anyhow::Result;

use crate::domain::{
    repositories::{
        mission_chat::MissionChatRepository, mission_operation::MissionOperationRepository,
        mission_viewing::MissionViewingRepository,
    },
    value_objects::mission_statuses::MissionStatuses,
};

pub struct MissionOperationUseCase<T1, T2, T3>
where
    T1: MissionOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionChatRepository + Send + Sync,
{
    mission_operation_repository: Arc<T1>,
    missiom_viewing_repository: Arc<T2>,
    mission_chat_repository: Arc<T3>,
}

impl<T1, T2, T3> MissionOperationUseCase<T1, T2, T3>
where
    T1: MissionOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionChatRepository + Send + Sync,
{
    pub fn new(
        mission_operation_repository: Arc<T1>,
        missiom_viewing_repository: Arc<T2>,
        mission_chat_repository: Arc<T3>,
    ) -> Self {
        Self {
            mission_operation_repository,
            missiom_viewing_repository,
            mission_chat_repository,
        }
    }

    pub async fn in_progress(&self, mission_id: i32, chief_id: i32) -> Result<i32> {
        let mission = self.missiom_viewing_repository.get_one(mission_id).await?;

        let crew_count = self
            .missiom_viewing_repository
            .crew_counting(mission_id)
            .await?;

        let is_status_open_or_fail = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string();

        let max_crew_per_mission = std::env::var("MAX_CREW_PER_MISSION")
            .expect("missing value")
            .trim()
            .parse()?;

        if !is_status_open_or_fail {
            return Err(anyhow::anyhow!("Invalid mission status to start!"));
        }

        if mission.chief_id != chief_id {
            return Err(anyhow::anyhow!("Only the chief can start the mission!"));
        }

        if crew_count <= 1 {
            return Err(anyhow::anyhow!("Mission requires at least one crew member besides the chief to start!"));
        }

        if crew_count > max_crew_per_mission {
            return Err(anyhow::anyhow!("Mission crew exceeds maximum limit!"));
        }

        let result = self
            .mission_operation_repository
            .to_progress(mission_id, chief_id)
            .await?;

        Ok(result)
    }
    pub async fn to_completed(&self, mission_id: i32, chief_id: i32) -> Result<i32> {
        let mission = self.missiom_viewing_repository.get_one(mission_id).await?;

        let update_condition = mission.status == MissionStatuses::InProgress.to_string()
            && mission.chief_id == chief_id;
        if !update_condition {
            return Err(anyhow::anyhow!("Invalid condition to change stages!"));
        }
        let result = self
            .mission_operation_repository
            .to_completed(mission_id, chief_id)
            .await?;

        // Delete mission chats after completion
        let _ = self.mission_chat_repository.delete_messages(mission_id).await;

        Ok(result)
    }
    pub async fn to_failed(&self, mission_id: i32, chief_id: i32) -> Result<i32> {
        let mission = self.missiom_viewing_repository.get_one(mission_id).await?;

        let update_condition = mission.status == MissionStatuses::InProgress.to_string()
            && mission.chief_id == chief_id;
        if !update_condition {
            return Err(anyhow::anyhow!("Invalid condition to change stages!"));
        }
        let result = self
            .mission_operation_repository
            .to_failed(mission_id, chief_id)
            .await?;

        // Delete mission chats after failure
        let _ = self.mission_chat_repository.delete_messages(mission_id).await;

        Ok(result)
    }
}