use std::sync::Arc;
use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;

use crate::{
    domain::{
        repositories::mission_chat::MissionChatRepository,
        value_objects::mission_chat_model::MissionChatModel,
    },
    infrastructure::database::postgresql_connection::PgPoolSquad,
};

pub struct MissionChatPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl MissionChatPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl MissionChatRepository for MissionChatPostgres {
    async fn add_message(&self, mission_id: i32, brawler_id: i32, message: &str) -> Result<MissionChatModel> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let inserted_id: i32 = diesel::insert_into(crate::infrastructure::database::schema::mission_chats::table)
            .values((
                crate::infrastructure::database::schema::mission_chats::mission_id.eq(mission_id),
                crate::infrastructure::database::schema::mission_chats::brawler_id.eq(brawler_id),
                crate::infrastructure::database::schema::mission_chats::message.eq(message),
            ))
            .returning(crate::infrastructure::database::schema::mission_chats::id)
            .get_result(&mut conn)?;

        let sql = r#"
            SELECT c.id, c.mission_id, c.brawler_id, b.display_name as brawler_name, c.message, c.created_at
            FROM mission_chats c
            INNER JOIN brawlers b ON b.id = c.brawler_id
            WHERE c.id = $1
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(inserted_id)
            .get_result::<MissionChatModel>(&mut conn)?;

        Ok(result)
    }

    async fn get_messages(&self, mission_id: i32) -> Result<Vec<MissionChatModel>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT c.id, c.mission_id, c.brawler_id, b.display_name as brawler_name, c.message, c.created_at
            FROM mission_chats c
            INNER JOIN brawlers b ON b.id = c.brawler_id
            WHERE c.mission_id = $1
            ORDER BY c.created_at ASC
        "#;

        let results = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .get_results::<MissionChatModel>(&mut conn)?;

        Ok(results)
    }

    async fn delete_messages(&self, mission_id: i32) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(crate::infrastructure::database::schema::mission_chats::table)
            .filter(crate::infrastructure::database::schema::mission_chats::mission_id.eq(mission_id))
            .execute(&mut conn)?;

        Ok(())
    }
}
