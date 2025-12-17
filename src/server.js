const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const routesRouter = require('./routes/routes');
const schedulesRouter = require('./routes/schedules');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow all origins and handle preflight requests
app.use((req, res, next) => {
  // Allow all origins
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Also use cors middleware for additional support
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};
app.use(cors(corsOptions));

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