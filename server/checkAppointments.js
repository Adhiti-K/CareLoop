
const { pool } = require('./config/db');

async function checkAppointments() {
  try {
    const [columns] = await pool.query(
      'SHOW COLUMNS FROM appointments'
    );

    console.log('\nAppointment table columns:');

    columns.forEach((column) => {
      console.log(column.Field);
    });

    const exists = columns.some(
      (column) => column.Field === 'nurse_id'
    );

    console.log(
      '\nnurse_id status:',
      exists ? 'ALREADY EXISTS' : 'NOT EXISTS'
    );
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAppointments();
