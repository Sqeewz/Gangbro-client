use anyhow::Result;
use async_trait::async_trait;
use crate::domain::value_objects::system_stats::SystemStatsModel;

#[async_trait]
pub trait SystemRepository {
    async fn get_stats(&self) -> Result<SystemStatsModel>;
}
