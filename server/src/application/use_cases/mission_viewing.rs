use std::sync::Arc;

use anyhow::{Ok, Result};

use crate::domain::{
    repositories::mission_viewing::MissionViewingRepository,
    value_objects::{
        brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel,
    },
};
pub struct MissionViewingUseCase<T>
where
    T: MissionViewingRepository + Send + Sync,
{
    mission_viewing_repository: Arc<T>,
}

impl<T> MissionViewingUseCase<T>
where
    T: MissionViewingRepository + Send + Sync,
{
    pub fn new(mission_viewing_repository: Arc<T>) -> Self {
        Self {
            mission_viewing_repository,
        }
    }

    pub async fn get_one(&self, mission_id: i32) -> Result<MissionModel> {
        let model = self.mission_viewing_repository.get_one(mission_id).await?;

        Ok(model)
    }

    pub async fn get_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        let result = self.mission_viewing_repository.get_crew(mission_id).await?;
        Ok(result)
    }

    pub async fn get_all(&self, filter: &MissionFilter) -> Result<Vec<MissionModel>> {
        let models = self.mission_viewing_repository.get_all(filter).await?;

      
        Ok(models)
    }

    pub async fn get_mission_count(&self, mission_id: i32) -> Result<i64> {
        self.mission_viewing_repository.crew_counting(mission_id).await
    }
}