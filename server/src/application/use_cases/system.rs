use crate::domain::repositories::system::SystemRepository;
use crate::domain::value_objects::system_stats::SystemStatsModel;
use anyhow::Result;

pub struct SystemUseCase<T: SystemRepository> {
    repo: T,
}

impl<T: SystemRepository> SystemUseCase<T> {
    pub fn new(repo: T) -> Self {
        Self { repo }
    }

    pub async fn get_stats(&self) -> Result<SystemStatsModel> {
        self.repo.get_stats().await
    }
}
