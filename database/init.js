const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath = path.join(__dirname, 'seed.sql');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'landline',
  user: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);

    try {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'reservations'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        await client.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='reservations' AND column_name='user_id') THEN
              ALTER TABLE reservations ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
            END IF;
          END $$;
        `);
        
        await client.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='reservations' AND column_name='seat_level') THEN
              ALTER TABLE reservations ADD COLUMN seat_level INTEGER CHECK(seat_level IN (1, 2, 3));
            END IF;
          END $$;
        `);
      }
      
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='reservations' AND column_name='user_id'
          ) THEN
            CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
          END IF;
        END $$;
      `);
    } catch (err) {
    }

    const result = await client.query('SELECT COUNT(*) FROM routes');
    const routeCount = parseInt(result.rows[0].count);
    
    if (routeCount > 0) {
      await client.query('TRUNCATE TABLE booking_modifications CASCADE');
      await client.query('TRUNCATE TABLE reservations CASCADE');
      await client.query('TRUNCATE TABLE inventory CASCADE');
      await client.query('TRUNCATE TABLE schedules CASCADE');
      await client.query('TRUNCATE TABLE routes CASCADE');
      await client.query('ALTER SEQUENCE routes_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE schedules_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE inventory_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE reservations_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE booking_modifications_id_seq RESTART WITH 1');
    }

    const seed = fs.readFileSync(seedPath, 'utf8');
    const cleanedSeed = seed
      .split('\n')
      .filter(line => !line.trim().startsWith('--') || line.trim() === '')
      .join('\n');
    
    const statements = cleanedSeed
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('note'));
    
    for (const statement of statements) {
      if (statement.length > 0 && !statement.toLowerCase().includes('note')) {
        try {
          await client.query(statement);
        } catch (err) {
          throw err;
        }
      }
    }

    await generateInventory(client);
  } catch (err) {
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function generateInventory(client) {
  const schedulesResult = await client.query('SELECT id, route_id FROM schedules');
  const schedules = schedulesResult.rows;

  const today = new Date();

  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();

    for (const schedule of schedules) {
      const scheduleResult = await client.query(
        'SELECT day_of_week FROM schedules WHERE id = $1',
        [schedule.id]
      );

      const sched = scheduleResult.rows[0];

      if (sched.day_of_week === null || sched.day_of_week === dayOfWeek) {
        const routeResult = await client.query(
          'SELECT base_price FROM routes WHERE id = $1',
          [schedule.route_id]
        );

        const route = routeResult.rows[0];

        let priceModifier = 1.0;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          priceModifier = 1.15;
        }

        const totalSeats = 14;
        const availableSeats = totalSeats;

        await client.query(
          `INSERT INTO inventory (schedule_id, date, total_seats, available_seats, price_modifier)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (schedule_id, date) DO NOTHING`,
          [schedule.id, dateStr, totalSeats, availableSeats, priceModifier]
        );
      }
    }
  }
}

initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });