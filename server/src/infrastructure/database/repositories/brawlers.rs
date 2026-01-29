use anyhow::{Ok, Result};
use async_trait::async_trait;
use chrono::{Duration, Utc};
use diesel::{
    ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, insert_into,
};
use std::sync::Arc;

use crate::{
    config::config_loader::get_jwt_env,
    domain::{
        entities::brawlers::{BrawlerEntity, RegisterBrawlerEntity},
        repositories::brawlers::BrawlerRepository,
        value_objects::{base64_image::Base64Image, uploaded_image::UploadedImage, mission_model::MissionModel},
    },
    infrastructure::{
        cloudinary::{self, UploadImageOptions},
        database::{
            postgresql_connection::PgPoolSquad,
            schema::{brawlers, crew_memberships},
        },
        jwt::{
            generate_token,
            jwt_model::{Claims, Passport},
        },
    },
};

pub struct BrawlerPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl BrawlerPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl BrawlerRepository for BrawlerPostgres {
    async fn register(&self, register_brawler_entity: RegisterBrawlerEntity) -> Result<Passport> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let user_id = insert_into(brawlers::table)
            .values(&register_brawler_entity)
            .returning(brawlers::id)
            .get_result::<i32>(&mut connection)?;

        let display_name = register_brawler_entity.display_name;

        let jwt_env = get_jwt_env()?;
        let claims = Claims {
            sub: user_id.to_string(),
            exp: (Utc::now() + Duration::days(jwt_env.lift_time_days)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };
        let token = generate_token(jwt_env.secret, &claims)?;
        Ok(Passport {
            token,
            display_name,
            avatar_url: None,
        })
    }

    async fn find_by_username(&self, username: String) -> Result<BrawlerEntity> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let result = brawlers::table
            .filter(brawlers::username.eq(username))
            .select(BrawlerEntity::as_select())
            .first::<BrawlerEntity>(&mut connection)?;

        Ok(result)
    }

    async fn upload_base64img(
        &self,
        user_id: i32,
        base64img: Base64Image,
        opt: UploadImageOptions,
    ) -> Result<UploadedImage> {
        let uploaded_img = cloudinary::upload(base64img, opt).await?;

        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::update(brawlers::table)
            .filter(brawlers::id.eq(user_id))
            .set((
                brawlers::avatar_url.eq(uploaded_img.url.clone()),
                brawlers::avatar_public_id.eq(uploaded_img.public_id.clone()),
            ))
            .execute(&mut conn)?;

        Ok(uploaded_img)
    }

    async fn crew_counting(&self, mission_id: i32) -> Result<u32> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let count: i64 = crew_memberships::table
            .filter(crew_memberships::mission_id.eq(mission_id))
            .count()
            .get_result(&mut connection)?;

        Ok(count as u32)
    }

    async fn get_missions(&self, brawler_id: i32) -> Result<Vec<MissionModel>> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT 
                m.id, 
                m.name, 
                m.description, 
                m.status, 
                m.chief_id, 
                b.display_name AS chief_display_name, 
                (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS crew_count, 
                m.created_at, 
                m.updated_at
            FROM missions m
            JOIN brawlers b ON m.chief_id = b.id
            WHERE m.chief_id = $1
            ORDER BY m.created_at DESC
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .load::<MissionModel>(&mut connection)?;

        Ok(result)
    }
}