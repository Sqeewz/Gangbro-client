use anyhow::Result;
use async_trait::async_trait;

use crate::domain::entities::crew_memberships::CrewMembershipEntity;

#[async_trait]
pub trait CrewOperationRepository {
    async fn join(&self, crew_member_ships: CrewMembershipEntity) -> Result<()>;
    async fn leave(&self, crew_member_ships: CrewMembershipEntity) -> Result<()>;
}