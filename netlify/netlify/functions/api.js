const mysql = require("mysql2/promise");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });

    await conn.execute(
      "CREATE TABLE IF NOT EXISTS ismlar (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    );

    if (event.httpMethod === "GET") {
      const [rows] = await conn.execute("SELECT id, name FROM ismlar ORDER BY id DESC");
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const name = (body.name || "").trim();
      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Ism bo'sh bo'lmasin" }) };
      }
      const [result] = await conn.execute("INSERT INTO ismlar (name) VALUES (?)", [name]);
      return { statusCode: 201, headers, body: JSON.stringify({ id: result.insertId, name }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  } finally {
    if (conn) await conn.end();
  }
};
