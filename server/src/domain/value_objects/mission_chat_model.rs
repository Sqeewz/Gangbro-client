use chrono::NaiveDateTime;
use diesel::prelude::QueryableByName;
use diesel::sql_types::{Int4, Text, Timestamp, Varchar};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, QueryableByName)]
pub struct MissionChatModel {
    #[diesel(sql_type = Int4)]
    pub id: i32,
    #[diesel(sql_type = Int4)]
    pub mission_id: i32,
    #[diesel(sql_type = Int4)]
    pub brawler_id: i32,
    #[diesel(sql_type = Varchar)]
    pub brawler_name: String,
    #[diesel(sql_type = Text)]
    pub message: String,
    #[diesel(sql_type = Timestamp)]
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddMissionChatModel {
    pub message: String,
}
