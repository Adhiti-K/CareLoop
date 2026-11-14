const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorMiddleware');
const { initReminderJob } = require('./jobs/reminderJob');
const { initMissedAppointmentJob } = require('./jobs/missedAppointmentJob');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const nurseRoutes = require('./routes/nurseRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const dischargeRoutes = require('./routes/dischargeRoutes');
const qrRoutes = require('./routes/qrRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const queryRoutes = require('./routes/queryRoutes');
const documentRoutes = require('./routes/documentRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev client
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CareLoop Backend REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/discharges', dischargeRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/caregiver', caregiverRoutes);
app.use('/api/departments', departmentRoutes);

// Central Error Handler
app.use(errorHandler);

// Start Cron background jobs
initReminderJob();
initMissedAppointmentJob();

const PORT = env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 CARELOOP Backend API running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = app;
