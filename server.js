/*
  BACK-END with a REAL DATABASE (SQLite)

  What changed from the JSON file version:
  - Instead of reading/writing a whole file, we use SQL queries
  - SQL (Structured Query Language) is the standard way to talk to databases
  - SQLite stores everything in a single .db file, but with real database features:
    data types, indexing, safe concurrent access, and powerful queries
*/

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- OPEN THE DATABASE ---
// This creates 'taskflow.db' if it doesn't exist, or opens it if it does.
const db = new Database(path.join(__dirname, 'taskflow.db'));

// --- CREATE THE TABLE ---
// A "table" is like a spreadsheet: columns define the structure, rows are the data.
// IF NOT EXISTS means it only creates the table the first time; after that, it skips.
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// --- PREPARE SQL STATEMENTS ---
// "Prepared statements" are pre-compiled queries. They're faster and safer
// than building query strings by hand (which can allow SQL injection attacks).

const getAllTasks = db.prepare('SELECT * FROM tasks ORDER BY id DESC');
const insertTask = db.prepare('INSERT INTO tasks (text) VALUES (?)');
const toggleTask = db.prepare('UPDATE tasks SET completed = NOT completed WHERE id = ?');
const deleteTask = db.prepare('DELETE FROM tasks WHERE id = ?');
const clearCompleted = db.prepare('DELETE FROM tasks WHERE completed = 1');

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(__dirname));

// --- API ROUTES ---

// GET /api/tasks — fetch all tasks
app.get('/api/tasks', (req, res) => {
    const tasks = getAllTasks.all();

    // Convert SQLite's 0/1 to true/false for the front-end
    const formatted = tasks.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed === 1,
        created_at: t.created_at,
    }));

    res.json(formatted);
});

// POST /api/tasks — create a new task
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Task text is required' });
    }

    const result = insertTask.run(text.trim());

    res.status(201).json({
        id: result.lastInsertRowid,
        text: text.trim(),
        completed: false,
    });
});

// PUT /api/tasks/:id — toggle a task's completed status
app.put('/api/tasks/:id', (req, res) => {
    const result = toggleTask.run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
});

// DELETE /api/tasks/:id — delete a single task
app.delete('/api/tasks/:id', (req, res) => {
    const result = deleteTask.run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
});

// DELETE /api/tasks — clear all completed tasks
app.delete('/api/tasks', (req, res) => {
    clearCompleted.run();
    res.json({ success: true });
});

// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Taskflow server running at http://localhost:${PORT}`);
    console.log('Database: SQLite (taskflow.db)');
});
