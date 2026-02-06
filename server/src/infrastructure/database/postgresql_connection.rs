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
    
    // Read pool size from ENV or default to 5 (safe for small Supabase instances)
    let pool_size: u32 = std::env::var("DATABASE_POOL_SIZE")
        .unwrap_or_else(|_| "5".to_string())
        .parse()
        .unwrap_or(5);

    let pool = Pool::builder()
        .max_size(pool_size)
        .build(manager)?;
    
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