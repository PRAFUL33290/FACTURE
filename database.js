const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'invoices.db');

let db;

function getDb() {
    if (!db) {
        const fs = require('fs');
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        db = new sqlite3.Database(dbPath);
    }
    return db;
}

function initDatabase() {
    return new Promise((resolve, reject) => {
        const database = getDb();
        
        database.serialize(() => {
            // Create clients table
            database.run(`
                CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    city TEXT,
                    country TEXT DEFAULT 'India',
                    gst_number TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create invoices table
            database.run(`
                CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_number TEXT UNIQUE NOT NULL,
                    client_id INTEGER NOT NULL,
                    invoice_date DATE NOT NULL,
                    due_date DATE,
                    subtotal REAL DEFAULT 0,
                    tax_rate REAL DEFAULT 18,
                    tax_amount REAL DEFAULT 0,
                    total REAL DEFAULT 0,
                    status TEXT DEFAULT 'draft',
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (client_id) REFERENCES clients(id)
                )
            `);

            // Create invoice items table
            database.run(`
                CREATE TABLE IF NOT EXISTS invoice_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_id INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    unit_price REAL NOT NULL,
                    total REAL NOT NULL,
                    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database initialized successfully');
                    resolve();
                }
            });
        });
    });
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

module.exports = {
    initDatabase,
    getDb,
    runQuery,
    getAll,
    getOne
};
