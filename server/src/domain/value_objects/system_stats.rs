use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStatsModel {
    pub active_members: i64,
    pub missions_completed: i64,
    pub missions_failed: i64,
    pub success_rate: f64,
}
