use std::sync::Arc;
use anyhow::Result;
use crate::domain::repositories::mission_chat::MissionChatRepository;
use crate::domain::value_objects::mission_chat_model::MissionChatModel;

pub struct MissionChatUseCase<T>
where
    T: MissionChatRepository + Send + Sync,
{
    repo: Arc<T>,
}

impl<T> MissionChatUseCase<T>
where
    T: MissionChatRepository + Send + Sync,
{
    pub fn new(repo: Arc<T>) -> Self {
        Self { repo }
    }

    pub async fn add_message(&self, mission_id: i32, brawler_id: i32, message: &str) -> Result<MissionChatModel> {
        self.repo.add_message(mission_id, brawler_id, message).await
    }

    pub async fn get_messages(&self, mission_id: i32) -> Result<Vec<MissionChatModel>> {
        self.repo.get_messages(mission_id).await
    }

    pub async fn delete_messages(&self, mission_id: i32) -> Result<()> {
        self.repo.delete_messages(mission_id).await
    }
}
