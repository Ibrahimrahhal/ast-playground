import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import mysql from 'mysql';

const app = express();
app.use(express.json());

// Hardcoded credentials
const db = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'admin123', // SENSITIVE: Hardcoded password
    database: 'testdb'
});

app.get('/xss', (req, res) => {
    const name = req.query.name;
    res.send(`<h1>Hello ${name}</h1>`); // XSS: Unsanitized output
});

app.post('/sql', (req, res) => {
    const user = req.body.username;
    const query = `SELECT * FROM users WHERE name = '${user}'`; // SQL Injection
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/run', (req, res) => {
    const cmd = req.query.cmd as string;
    exec(cmd, (err, stdout, stderr) => { // Command Injection
        if (err) return res.send(err.message);
        res.send(stdout);
    });
});

app.get('/read', (req, res) => {
    const file = req.query.file as string;
    fs.readFile(file, 'utf8', (err, data) => { // Insecure file read
        if (err) return res.status(500).send('Error');
        res.send(data);
    });
});

app.listen(3000, () => console.log('Server started on port 3000'));
