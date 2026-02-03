use anyhow::Result;

use crate::config::{config_model::{CloudinaryEnv, Database, DotEnvyConfig, JwtEnv, Server}, stage::Stage};

pub fn load() -> Result<DotEnvyConfig> {
    if let Err(e) = dotenvy::dotenv() {
        eprintln!("Warning: Error loading .env file: {}", e);
    }
    
    // Render typically provides PORT environment variable
    let port = std::env::var("PORT")
        .or_else(|_| std::env::var("SERVER_PORT"))
        .unwrap_or_else(|_| "8080".to_string())
        .trim()
        .parse()
        .unwrap_or(8080);

    let server = Server {
        port,
        body_limit: std::env::var("SERVER_BODY_LIMIT")
            .unwrap_or_else(|_| "10".to_string())
            .trim()
            .parse()
            .unwrap_or(10),
        timeout: std::env::var("SERVER_TIMEOUT")
            .unwrap_or_else(|_| "90".to_string())
            .trim()
            .parse()
            .unwrap_or(90),
    };

    let database = Database {
        url: std::env::var("DATABASE_URL").expect("DATABASE_URL must be set in environment variables"),
    };

    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET not set");

    let config = DotEnvyConfig {
        server,
        database,
        secret,
    };

    Ok(config)
}

pub fn get_stage() ->Stage {
    dotenvy::dotenv().ok();

    let stage_str = std::env::var("STAGE").unwrap_or_else(|_| "".to_string());

    Stage::from_str(&stage_str).unwrap_or_default()
}
pub fn get_user_secret() -> Result<String>{
    let secret_env = std::env::var("JWT_SECRET")
    .map_err(|_| anyhow::anyhow!("JWT_SECRET not set"))?;
    Ok(secret_env)
}


// pub fn get_user_secret_env() -> Result<JwtEnv> {
pub fn get_jwt_env() -> Result<JwtEnv> {
    dotenvy::dotenv().ok();

    Ok(JwtEnv {
        secret: std::env::var("JWT_USER_SECRET")?,
        lift_time_days: std::env::var("JTW_LIFTTIME_DAYS")?.parse::<i64>()?,
    })
}

pub fn get_cloudinary_env() -> Result<CloudinaryEnv> {
    dotenvy::dotenv().ok();

    let cloud_name = std::env::var("CLOUDINARY_CLOUD_NAME")?;
    let api_key = std::env::var("CLOUDINARY_API_KEY")?;
    let api_secret = std::env::var("CLOUDINARY_API_SECRET")?;

    Ok(CloudinaryEnv {
        cloud_name,
        api_key,
        api_secret,
    })
}