const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const routesRouter = require('./routes/routes');
const schedulesRouter = require('./routes/schedules');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS - MUST be the first middleware, before all routes
// Allow all origins and all methods
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins - no restrictions
    // Origin can be undefined for same-origin requests
    callback(null, true);
  },
  credentials: false, // Set to false when allowing all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: [],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Additional manual headers as backup (runs after cors middleware)
app.use((req, res, next) => {
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/routes', routesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/bookings', bookingsRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Only start server if running as standalone (not as Netlify function)
if (require.main === module) {
  // Running as standalone server
  db.connect()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
          console.error(`To find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
        } else {
          console.error('Server error:', err);
        }
        process.exit(1);
      });
    })
    .catch((err) => {
      console.error('Database connection error:', err.message);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    await db.close();
    process.exit(0);
  });
} else {
  // Running as Netlify function - initialize DB connection
  db.connect().catch((err) => {
    console.error('Database connection error:', err.message);
  });
}

module.exports = app;