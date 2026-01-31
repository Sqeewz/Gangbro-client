use anyhow::Result;
use async_trait::async_trait;
use crate::domain::value_objects::mission_chat_model::MissionChatModel;

#[async_trait]
pub trait MissionChatRepository {
    async fn add_message(&self, mission_id: i32, brawler_id: i32, message: &str) -> Result<MissionChatModel>;
    async fn get_messages(&self, mission_id: i32) -> Result<Vec<MissionChatModel>>;
    async fn delete_messages(&self, mission_id: i32) -> Result<()>;
}
