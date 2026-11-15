
const { pool } = require('./config/db');

async function checkTables() {
  try {
    const tables = [
      'users',
      'appointments',
      'patients',
      'patient_caregiver_mappings',
      'caregiver_handovers',
      'discharge_summaries'
    ];

    for (const table of tables) {
      const [columns] = await pool.query(
        `SHOW COLUMNS FROM \`${table}\``
      );

      console.log(`\n========== ${table} ==========`);
      console.log(columns.map(column => column.Field).join(', '));
    }

    console.log('\nDatabase verification completed.');
  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
