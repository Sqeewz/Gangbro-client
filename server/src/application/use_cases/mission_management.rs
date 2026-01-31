use std::sync::Arc;

use crate::{domain::{
    repositories::{
        crew_operation::CrewOperationRepository, mission_chat::MissionChatRepository,
        mission_management::MissionManagementRepository, mission_viewing::MissionViewingRepository,
    },
    value_objects::mission_model::{AddMissionModel, EditMissionModel},
}, domain::entities::crew_memberships::CrewMembershipEntity};

pub struct MissionManagementUseCase<T1, T2, T3>
where
    T1: MissionManagementRepository + Send + Sync,
    T2: MissionChatRepository + Send + Sync,
    T3: CrewOperationRepository + Send + Sync,
{
    mission_management_repository: Arc<T1>,
    mission_chat_repository: Arc<T2>,
    crew_operation_repository: Arc<T3>,
}

use anyhow::Result;
impl<T1, T2, T3> MissionManagementUseCase<T1, T2, T3>
where
    T1: MissionManagementRepository + Send + Sync,
    T2: MissionChatRepository + Send + Sync,
    T3: CrewOperationRepository + Send + Sync,
{
    pub fn new(
        mission_management_repository: Arc<T1>,
        mission_chat_repository: Arc<T2>,
        crew_operation_repository: Arc<T3>,
    ) -> Self {
        Self {
            mission_management_repository,
            mission_chat_repository,
            crew_operation_repository,
        }
    }

    pub async fn add(&self, chief_id: i32, add_mission_model: AddMissionModel) -> Result<i32> {
        
        if add_mission_model.name.trim().is_empty() || add_mission_model.name.trim().len()<3 {
            return Err(anyhow::anyhow!("Mission name must be at least 3 characters long!"));
        }

        let insert_mission_entity = add_mission_model.to_entity(chief_id);

        let mission_id = self
            .mission_management_repository
            .add(insert_mission_entity)
            .await?;

        // Chief joins the mission automatically
        let _ = self.crew_operation_repository.join(CrewMembershipEntity {
            brawler_id: chief_id,
            mission_id,
        }, true).await;

        Ok(mission_id)
    }

    pub async fn edit(
        &self,
        mission_id: i32,
        chief_id: i32,
        mut edit_mission_model: EditMissionModel,
    ) -> Result<i32> {

        if let Some(name) = edit_mission_model.name {
            if name.trim().is_empty() {
                edit_mission_model.name = None;
            }else if name.trim().len()<3 {
                return Err(anyhow::anyhow!("Mission name must be at least 3 characters long!"));
            }else{
                edit_mission_model.name = Some(name.trim().to_string());
            }
        }

        // let crew_count = self
        //     .mission_viewing_repository
        //     .crew_counting(mission_id)
        //     .await?;
        // if crew_count > 0 {
        //     return Err(anyhow::anyhow!(
        //         "Mission has been taken by brawler for now!"
        //     ));
        // }

        let edit_mission_entity = edit_mission_model.to_entity(chief_id);

        let result = self
            .mission_management_repository
            .edit(mission_id, edit_mission_entity)
            .await?;

        Ok(result)
    }

    pub async fn remove(&self, mission_id: i32, chief_id: i32) -> Result<()> {
        // let crew_count = self
        //     .mission_viewing_repository
        //     .crew_counting(mission_id)
        //     .await?;
        // if crew_count > 0 {
        //     return Err(anyhow::anyhow!(
        //         "Mission has been taken by brawler for now!"
        //     ));
        // }

        self.mission_management_repository
            .remove(mission_id, chief_id)
            .await?;
        
        // Delete mission chats after removal
        let _ = self.mission_chat_repository.delete_messages(mission_id).await;

        Ok(())
    }
}