const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const routesRouter = require('./routes/routes');
const schedulesRouter = require('./routes/schedules');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: [
    "https://landline-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true
}));

app.options("*", cors());

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

db.connect()
  .then(() => {
    const server = app.listen(PORT, () => {});

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        process.exit(1);
      } else {
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

module.exports = app;