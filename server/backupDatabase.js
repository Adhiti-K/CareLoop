
const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  try {
    const [tables] = await pool.query('SHOW TABLES');

    const backup = {};

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [records] = await pool.query(
        `SELECT * FROM \`${tableName}\``
      );

      backup[tableName] = records;
    }

    const backupPath =
      'C:\\CareLoop\\backups\\careloop_db_before_phase5.json';

    fs.writeFileSync(
      backupPath,
      JSON.stringify(backup, null, 2)
    );

    console.log('Database backup completed!');
    console.log('Tables backed up:', tables.length);
    console.log('Backup location:', backupPath);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

backupDatabase();
