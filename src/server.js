const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const routesRouter = require('./routes/routes');
const schedulesRouter = require('./routes/schedules');
const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
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

db.connect()
  .then(() => {
    app.listen(PORT, () => {});
  })
  .catch((err) => {
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

module.exports = app;