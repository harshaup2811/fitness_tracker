const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Create MySQL pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'HUP28@dbms',
  database: 'fittrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ---------- Login Endpoint ----------
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  const sql = `
    SELECT * FROM users 
    WHERE (username = ? OR email = ? OR phone = ?) AND password = ?
  `;
  pool.execute(sql, [login, login, login, password], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length > 0) {
      res.json({ message: "Login successful", userId: results[0].id });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

// ---------- Registration Endpoint ----------
app.post('/register', (req, res) => {
  const { username, email, phone, password } = req.body;
  const sql = `
    INSERT INTO users (username, email, phone, password)
    VALUES (?, ?, ?, ?)
  `;
  pool.execute(sql, [username, email, phone, password], (err, results) => {
    if (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Database error or duplicate entry" });
    }
    res.json({ message: "Registration successful", userId: results.insertId });
  });
});

// ---------- Log Metrics Endpoint ----------
app.post('/logMetrics', (req, res) => {
  const { userId, activity, meter, calories, duration } = req.body;
  const sql = `
    INSERT INTO metrics (userId, activity, meter, calories, duration)
    VALUES (?, ?, ?, ?, ?)
  `;
  pool.execute(sql, [userId, activity, meter, calories, duration], (err, results) => {
    if (err) {
      console.error("Log metrics error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Activity logged successfully", metricId: results.insertId });
  });
});

// ---------- Get Metrics for a User ----------
app.get('/metrics/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT * FROM metrics
    WHERE userId = ?
    ORDER BY created_at DESC
  `;
  pool.execute(sql, [userId], (err, results) => {
    if (err) {
      console.error("Get metrics error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ---------- Delete a Metric ----------
app.delete('/metrics/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    DELETE FROM metrics WHERE id = ?
  `;
  pool.execute(sql, [id], (err, results) => {
    if (err) {
      console.error("Delete metric error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Metric deleted successfully" });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
