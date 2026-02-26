import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupTestDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USERNAME || 'lwin',
    password: process.env.DB_PASSWORD || 'Pass!@moe123',
    database: 'postgres', // Connect to default system db
  });

  try {
    await client.connect();
    const dbName = 'inventory_valuation_test';
    
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (res.rowCount === 0) {
      console.log(`Creating test database: ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('Test database created successfully.');
    } else {
      console.log('Test database already exists.');
    }
  } catch (err) {
    console.error('Error setting up test database:', err.message);
  } finally {
    await client.end();
  }
}

setupTestDb();
