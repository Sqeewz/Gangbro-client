use crate::domain::repositories::system::SystemRepository;
use crate::domain::value_objects::system_stats::SystemStatsModel;
use crate::infrastructure::database::postgresql_connection::PgPoolSquad;
use anyhow::{Result, Context};
use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

pub struct SystemPostgres {
    pool: Arc<PgPoolSquad>,
}

impl SystemPostgres {
    pub fn new(pool: Arc<PgPoolSquad>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl SystemRepository for SystemPostgres {
    async fn get_stats(&self) -> Result<SystemStatsModel> {
        use crate::infrastructure::database::schema::brawlers;
        use crate::infrastructure::database::schema::missions;

        let mut conn = self.pool.get().context("Failed to get connection")?;

        let active_members = brawlers::table.count().get_result::<i64>(&mut conn)?;
        
        let missions_completed = missions::table
            .filter(missions::status.eq("Completed"))
            .count()
            .get_result::<i64>(&mut conn)?;

        let missions_failed = missions::table
            .filter(missions::status.eq("Failed"))
            .count()
            .get_result::<i64>(&mut conn)?;

        let success_rate = if missions_completed + missions_failed > 0 {
            (missions_completed as f64 / (missions_completed + missions_failed) as f64) * 100.0
        } else {
            100.0 // Default to 100 if none completed/failed yet
        };

        Ok(SystemStatsModel {
            active_members,
            missions_completed,
            missions_failed,
            success_rate,
        })
    }
}
