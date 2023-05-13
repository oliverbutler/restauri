
use sqlx::{sqlite::{SqlitePoolOptions, SqliteConnectOptions}, Pool, Row, Sqlite, SqlitePool, pool};
use ts_rs::TS;

async fn setup_database(pool: &SqlitePool) -> sqlx::Result<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS request_history (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL,
            status_code INTEGER NOT NULL,
            response_time_ms INTEGER NOT NULL,
            response_body TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            request_id INTEGER NOT NULL,
            FOREIGN KEY (request_id) REFERENCES requests (id)
        )
        "#
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn add_request_history(pool: &SqlitePool, url: &str, request_id: i32, status_code: i32, response_time_ms: i32, response_body: &str) -> sqlx::Result<()> {
    sqlx::query(
        r#"
        INSERT INTO request_history (url, request_id, status_code, response_time_ms, response_body)
        VALUES (?, ?, ?, ?, ?)
        "#
    )
    .bind(url)
    .bind(request_id)
    .bind(status_code)
    .bind(response_time_ms)
    .bind(response_body)
    .execute(pool)
    .await?;
    Ok(())
}



#[tauri::command]
async fn add_request(pool: tauri::State<'_, Pool<Sqlite>>, url: &str) -> Result<String, String> {

    let mut conn = pool.acquire().await.unwrap();
    sqlx::query("INSERT INTO requests (url) VALUES (?)")
        .bind(url)
        .execute(&mut conn)
        .await
        .unwrap();


    Ok(format!("Added URL: {}!", url))

}


#[tauri::command]
async fn make_request(pool: tauri::State<'_, Pool<Sqlite>>, request_id: i32, url: &str) -> Result<String, String> {

  println!("Making request to: {}", url);

    let start_time = std::time::Instant::now();

    let response = reqwest::get(url).await.unwrap();
    
    let end_time = std::time::Instant::now();

    let status_code: i32 = response.status().as_u16() as i32;

    let body = response.text().await.unwrap();


    let response_time_ms: i32 = end_time.duration_since(start_time).as_millis() as i32;

    add_request_history(&pool, url, request_id, status_code, response_time_ms, &body).await.unwrap();

    Ok(body)
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize)]
struct Request {
  id: i32,
  url: String
}

#[derive(TS)]
#[ts(export)]
#[derive(serde::Serialize)]
struct RequestHistory {
  id: i32,
  url: String,
  status_code: i32,
  response_time_ms: i32,
  response_body: String,
  created_at: String,
  request_id: i32
}


#[tauri::command]
async fn get_requests(pool: tauri::State<'_, Pool<Sqlite>>) -> Result<Vec<Request>, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
    let rows = sqlx::query("SELECT * FROM requests")
        .fetch_all(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

      // Return a vector of Requests

   
    let mut requests: Vec<Request> = Vec::new();

    for row in rows {
      requests.push(Request {
        id: row.get(0),
        url: row.get(1)
      });
    }

    return Ok(requests);
}

#[tauri::command]
async fn get_request_history(pool: tauri::State<'_, Pool<Sqlite>>, request_id: i64) -> Result<Vec<RequestHistory>, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
    let rows = sqlx::query("SELECT * FROM request_history WHERE request_id = ? ORDER BY created_at DESC")
        .bind(request_id)
        .fetch_all(&mut conn)
        .await
        .map_err(|e| e.to_string())?;

      // Return a vector of Requests

   
    let mut requests: Vec<RequestHistory> = Vec::new();

    for row in rows {
      requests.push(RequestHistory {
        id: row.get(0),
        url: row.get(1),
        status_code: row.get(2),
        response_time_ms: row.get(3),
        response_body: row.get(4),
        created_at: row.get(5),
        request_id: row.get(6)
      });
    }

    return Ok(requests);
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {


    let pool = SqlitePoolOptions::new()
        .connect_with(
            SqliteConnectOptions::new()
                .filename("db.sqlite")
                .create_if_missing(true)
        )
        .await?;

    setup_database(&pool).await?;

    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![add_request, get_requests, make_request, get_request_history])
    .manage(pool)
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

    Ok(())
}