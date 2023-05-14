use sqlx::{
    pool::{self, PoolConnection},
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Row, Sqlite, SqlitePool,
};
use ts_rs::TS;

#[derive(TS, Debug, serde::Serialize, serde::Deserialize)]
#[ts(export)]

struct Request {
    id: i64,
    url: String,
    name: String,
    method: String,
    headers: String,
    body: Option<String>,
    created_at: chrono::NaiveDateTime,
}

#[derive(TS, Debug, serde::Serialize, serde::Deserialize)]
#[ts(export)]

struct RequestHistory {
    id: i64,
    url: String,
    request_headers: String,
    request_body: Option<String>,
    request_method: String,
    response_status_code: i64,
    response_time_ms: i64,
    response_body: String,
    created_at: chrono::NaiveDateTime,
    request_id: i64,
}

async fn add_request_history(
    pool: &tauri::State<'_, Pool<Sqlite>>,
    request_history: RequestHistory,
) -> sqlx::Result<()> {
    let mut conn = pool.acquire().await?;

    sqlx::query_as!(RequestHistory, "INSERT INTO request_history (url, request_headers, request_body, request_method, response_status_code, response_time_ms, response_body, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", request_history.url, request_history.request_headers, request_history.request_body, request_history.request_method, request_history.response_status_code, request_history.response_time_ms, request_history.response_body, request_history.request_id)
        .execute(&mut conn)
        .await?;

    Ok(())
}

#[tauri::command]
async fn add_request(pool: tauri::State<'_, Pool<Sqlite>>, name: &str) -> Result<String, String> {
    let mut conn = pool.acquire().await.unwrap();
    sqlx::query_as!(
        Request,
        "INSERT INTO requests (name, url, method, headers) VALUES (?, ?, ?, ?)",
        name,
        "",
        "GET",
        ""
    )
    .execute(&mut conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok("".to_string())
}

async fn get_request(
    pool: &tauri::State<'_, Pool<Sqlite>>,
    request_id: i32,
) -> Result<Request, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;

    let request = sqlx::query_as!(Request, "SELECT * FROM requests WHERE id = ?", request_id)
        .fetch_one(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    return Ok(request);
}

#[tauri::command]
async fn make_request(
    pool: tauri::State<'_, Pool<Sqlite>>,
    request_id: i32,
) -> Result<String, String> {
    let request = get_request(&pool, request_id).await.unwrap();

    let start_time = std::time::Instant::now();

    // Depending on method, make request

    let client = reqwest::Client::new();

    let url = request.url;
    let response = match request.method.as_str() {
        "GET" => client.get(&url).send().await.unwrap(),
        "POST" => client
            .post(&url)
            .body(match request.body {
                Some(body) => body,
                None => "".to_string(),
            })
            .header("Content-Type", "application/json")
            .send()
            .await
            .unwrap(),
        "PUT" => client.put(&url).send().await.unwrap(),
        "DELETE" => client.delete(&url).send().await.unwrap(),
        _ => client.get(&url).send().await.unwrap(),
    };

    let end_time = std::time::Instant::now();

    let status_code: i32 = response.status().as_u16() as i32;

    let body = response.text().await.unwrap();

    let response_time_ms: i32 = end_time.duration_since(start_time).as_millis() as i32;

    add_request_history(
        &pool,
        RequestHistory {
            id: 0,
            url: url.to_string(),
            request_headers: "".to_string(),
            request_body: None,
            request_method: "GET".to_string(),
            response_status_code: status_code as i64,
            response_time_ms: response_time_ms as i64,
            response_body: body.clone(),
            created_at: chrono::Utc::now().naive_utc(),
            request_id: request_id as i64,
        },
    )
    .await
    .unwrap();

    Ok(body)
}

#[tauri::command]
async fn get_requests(pool: tauri::State<'_, Pool<Sqlite>>) -> Result<Vec<Request>, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;

    let requests = sqlx::query_as!(Request, "SELECT * FROM requests ORDER BY created_at DESC")
        .fetch_all(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

    return Ok(requests);
}

#[tauri::command]
async fn get_request_history(
    pool: tauri::State<'_, Pool<Sqlite>>,
    request_id: i32,
) -> Result<Vec<RequestHistory>, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;

    let requests = sqlx::query_as!(
        RequestHistory,
        "SELECT * FROM request_history WHERE request_id = ? ORDER BY created_at DESC",
        request_id
    )
    .fetch_all(&mut conn)
    .await
    .map_err(|e| e.to_string())?;

    return Ok(requests);
}

#[tauri::command]
async fn update_request(
    pool: tauri::State<'_, Pool<Sqlite>>,
    request_id: i32,
    request: Request,
) -> Result<String, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;

    sqlx::query_as!(
        Request,
        "UPDATE requests SET url = ?, name = ?, method = ?, headers = ?, body = ? WHERE id = ?",
        request.url,
        request.name,
        request.method,
        request.headers,
        request.body,
        request_id
    )
    .execute(&mut conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(format!("Updated request: {}!", request_id))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pool = SqlitePoolOptions::new()
        .connect_with(
            SqliteConnectOptions::new()
                .filename("db.sqlite")
                .create_if_missing(true),
        )
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_request,
            get_requests,
            make_request,
            get_request_history,
            update_request
        ])
        .manage(pool)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
