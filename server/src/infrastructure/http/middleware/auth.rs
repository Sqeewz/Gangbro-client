use crate::infrastructure;
use crate::config::config_loader::get_jwt_env;
use axum::{Json, http::{Request, StatusCode, header}, middleware::Next, body::Body, response::{Response, IntoResponse}};
use serde_json::json;

pub async fn authorization(mut req: Request<Body>, next: Next) -> Response {
    let auth_header = match req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok()) {
            Some(header) => header,
            None => return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Missing Authorization header" }))
            ).into_response(),
        };

    let token = match auth_header.strip_prefix("Bearer ") {
        Some(token) => token,
        None => return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid Authorization header format" }))
        ).into_response(),
    };

    let jwt_env = match get_jwt_env() {
        Ok(env) => env,
        Err(_) => return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Server configuration error" }))
        ).into_response(),
    };

    let claims = match infrastructure::jwt::verify_token(jwt_env.secret, token.to_string()) {
        Ok(claims) => claims,
        Err(_) => return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid or expired token" }))
        ).into_response(),
    };
    
    let brawler_id = match claims.sub.parse::<i32>() {
        Ok(id) => id,
        Err(_) => return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid token subject" }))
        ).into_response(),
    };

    req.extensions_mut().insert::<i32>(brawler_id);
    next.run(req).await
}

