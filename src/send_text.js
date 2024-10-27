const pg = require('pg');
// import pg from 'pg';
const { Client } = pg;
const password = process.env.PGPASSWORD || 'password';
const user = process.env.PGUSER || 'postgres';
const host = process.env.PGHOST || 'localhost';
const port = process.env.PGPORT ? Number(process.env.PGPORT) : 5432;
const db = process.env.PGDATABASE || 'node_ec2_app';
const clientOptions = {
    user,
    host,
    password,
    port,
    database: db,
}
async function initalizeDBIfNeeded() {
    const client = new Client({
        user,
        host: host,
        password,
        port: 5432,
    });
    try {
        await client.connect();

        // we need a database for our app
        // create if not exists
        const isDbCreated = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${db}'`);
        console.log('isDbCreated:', isDbCreated.rows);
        if (isDbCreated.rows.length === 0) {
            const res1 = await client.query(`CREATE DATABASE ${db}`);
        } else {
            console.log('Database already exists');
        }

        // we need table for text messages: it has 3 columns: id(auto), text, and created_at
        await createTable();

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await client.end();
    }
}

async function createTable() {
    const client = new Client(clientOptions);
    await client.connect();
    const res = await client.query(`
        CREATE TABLE IF NOT EXISTS text_messages (
            id SERIAL PRIMARY KEY,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    // select first row
    const res2 = await client.query('SELECT * FROM text_messages LIMIT 1');
    console.log('text_messages table first row:', res2.rows);
    await client.end();
}

async function getMessages() {
    try {
        const client = new Client(clientOptions);
        await client.connect();

        const res = await client.query('SELECT * FROM text_messages ORDER BY created_at DESC');
        await client.end();

        return res.rows;
    } catch (error) {
        console.error('Error getting messages:', error);
    }
}

async function createMessage(text) {
    try {
        const client = new Client(clientOptions);
        await client.connect();

        const res = await client.query('INSERT INTO text_messages (text) VALUES ($1)', [text]);
        await client.end();
    } catch (error) {
        console.error('Error creating message:', error);
    }
}

module.exports = {
    initalizeDBIfNeeded,
    getMessages,
    createMessage
};