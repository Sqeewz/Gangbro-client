use anyhow::{Result, Context};
use diesel::{
    prelude::*,
    r2d2::{ConnectionManager, Pool},
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("src/infrastructure/database/migrations");

pub type PgPoolSquad = Pool<ConnectionManager<PgConnection>>;

pub fn establish_connection(database_url: &str) -> Result<PgPoolSquad> {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = Pool::builder().build(manager)?;
    
    // Run migrations on startup
    let mut conn = pool.get().context("Failed to get connection for migrations")?;
    run_migrations(&mut conn)?;
    
    Ok(pool)
}

pub fn run_migrations(connection: &mut impl MigrationHarness<diesel::pg::Pg>) -> Result<()> {
    connection.run_pending_migrations(MIGRATIONS)
        .map_err(|e| anyhow::anyhow!("Failed to run migrations: {}", e))?;
    Ok(())
}