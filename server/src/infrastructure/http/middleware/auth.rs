use crate::infrastructure;
use crate::config::config_loader::get_user_secret as get_user_secret_env;
use axum::{http::{Request, StatusCode, header}, middleware::Next, body::Body, response::Response};
use anyhow::Result;

pub async fn authorization (mut req: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let secret_env = get_user_secret_env().map_err(|_| StatusCode::UNAUTHORIZED)?;

    let claims = 
        infrastructure::jwt::verify_token(secret_env, token.to_string())
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    let brawler_id = claims
        .sub
        .parse::<i32>()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert::<i32>(brawler_id);

    Ok(next.run(req).await)
    
    }

