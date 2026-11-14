const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dischargeRoutes = require('./routes/dischargeRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const passportRoutes = require('./routes/passportRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security and utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Basic Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CARELOOP - Digital Patient Recovery and Continuity of Care Platform API',
    status: 'online',
    version: '1.0.0',
    documentation: 'Adhiti - Documentation Team',
    developer: 'Inchara - Backend Developer'
  });
});

// Health-Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    if (!dbStatus.success) {
      return res.status(500).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: false,
          error: dbStatus.error
        },
        service: 'CareLoop Backend API'
      });
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        activeDatabase: dbStatus.activeDatabase,
        message: dbStatus.message
      },
      service: 'CareLoop Backend API',
      version: '1.0.0',
      environment: NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/discharge', dischargeRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/appointments', appointmentRoutes);
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on CareLoop backend.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Server Initialization
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(` CARELOOP Backend API Server Running`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: ${NODE_ENV}`);
    console.log(` Health-check: http://localhost:${PORT}/api/health`);
    console.log(` Auth: http://localhost:${PORT}/api/auth`);
    console.log(` Discharge: http://localhost:${PORT}/api/discharge`);
    console.log(` Handover: http://localhost:${PORT}/api/handover`);
    console.log(` Passport: http://localhost:${PORT}/api/passport`);
    console.log(`====================================================`);

    const dbCheck = await testConnection();
    if (dbCheck.success) {
      console.log(` [DB] ${dbCheck.message}`);
    } else {
      console.error(` [DB ERROR] Failed to connect:`, dbCheck.error);
    }
  });
}

module.exports = { app, server };
