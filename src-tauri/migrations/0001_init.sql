CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  headers TEXT NOT NULL,
  body TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  url TEXT NOT NULL,
  request_headers TEXT NOT NULL,
  request_body TEXT,
  request_method TEXT NOT NULL,
  response_status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id INTEGER NOT NULL,
  FOREIGN KEY (request_id) REFERENCES requests (id)
)