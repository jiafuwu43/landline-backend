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

    const locations = [
      'Los Angeles', 'San Francisco', 'Las Vegas', 'Sacramento', 'San Diego',
      'New York', 'Boston', 'Philadelphia', 'Portland', 'Phoenix'
    ];

    const basePrices = {
      'Los Angeles': { 'San Francisco': 49, 'Las Vegas': 39, 'Sacramento': 50, 'San Diego': 29, 'New York': 199, 'Boston': 209, 'Philadelphia': 189, 'Portland': 89, 'Phoenix': 55 },
      'San Francisco': { 'Los Angeles': 49, 'Las Vegas': 69, 'Sacramento': 25, 'San Diego': 59, 'New York': 209, 'Boston': 219, 'Philadelphia': 199, 'Portland': 79, 'Phoenix': 89 },
      'Las Vegas': { 'Los Angeles': 39, 'San Francisco': 69, 'Sacramento': 69, 'San Diego': 45, 'New York': 179, 'Boston': 189, 'Philadelphia': 169, 'Portland': 109, 'Phoenix': 42 },
      'Sacramento': { 'Los Angeles': 50, 'San Francisco': 25, 'Las Vegas': 69, 'San Diego': 59, 'New York': 199, 'Boston': 209, 'Philadelphia': 189, 'Portland': 69, 'Phoenix': 89 },
      'San Diego': { 'Los Angeles': 29, 'San Francisco': 59, 'Las Vegas': 45, 'Sacramento': 59, 'New York': 189, 'Boston': 199, 'Philadelphia': 179, 'Portland': 119, 'Phoenix': 48 },
      'New York': { 'Los Angeles': 199, 'San Francisco': 209, 'Las Vegas': 179, 'Sacramento': 199, 'San Diego': 189, 'Boston': 42, 'Philadelphia': 28, 'Portland': 179, 'Phoenix': 169 },
      'Boston': { 'Los Angeles': 209, 'San Francisco': 219, 'Las Vegas': 189, 'Sacramento': 209, 'San Diego': 199, 'New York': 42, 'Philadelphia': 48, 'Portland': 32, 'Phoenix': 179 },
      'Philadelphia': { 'Los Angeles': 189, 'San Francisco': 199, 'Las Vegas': 169, 'Sacramento': 189, 'San Diego': 179, 'New York': 28, 'Boston': 48, 'Portland': 179, 'Phoenix': 159 },
      'Portland': { 'Los Angeles': 89, 'San Francisco': 79, 'Las Vegas': 109, 'Sacramento': 69, 'San Diego': 119, 'New York': 179, 'Boston': 32, 'Philadelphia': 179, 'Phoenix': 139 },
      'Phoenix': { 'Los Angeles': 55, 'San Francisco': 89, 'Las Vegas': 42, 'Sacramento': 89, 'San Diego': 48, 'New York': 169, 'Boston': 179, 'Philadelphia': 159, 'Portland': 139 }
    };

    const distances = {
      'Los Angeles': { 'San Francisco': 380, 'Las Vegas': 270, 'Sacramento': 385, 'San Diego': 120, 'New York': 2789, 'Boston': 2977, 'Philadelphia': 2714, 'Portland': 960, 'Phoenix': 370 },
      'San Francisco': { 'Los Angeles': 380, 'Las Vegas': 568, 'Sacramento': 90, 'San Diego': 500, 'New York': 2905, 'Boston': 3093, 'Philadelphia': 2830, 'Portland': 635, 'Phoenix': 756 },
      'Las Vegas': { 'Los Angeles': 270, 'San Francisco': 568, 'Sacramento': 571, 'San Diego': 331, 'New York': 2520, 'Boston': 2708, 'Philadelphia': 2445, 'Portland': 1118, 'Phoenix': 300 },
      'Sacramento': { 'Los Angeles': 385, 'San Francisco': 90, 'Las Vegas': 571, 'San Diego': 500, 'New York': 2815, 'Boston': 3003, 'Philadelphia': 2740, 'Portland': 580, 'Phoenix': 756 },
      'San Diego': { 'Los Angeles': 120, 'San Francisco': 500, 'Las Vegas': 331, 'Sacramento': 500, 'New York': 2669, 'Boston': 2857, 'Philadelphia': 2594, 'Portland': 1255, 'Phoenix': 355 },
      'New York': { 'Los Angeles': 2789, 'San Francisco': 2905, 'Las Vegas': 2520, 'Sacramento': 2815, 'San Diego': 2669, 'Boston': 215, 'Philadelphia': 95, 'Portland': 2454, 'Phoenix': 2425 },
      'Boston': { 'Los Angeles': 2977, 'San Francisco': 3093, 'Las Vegas': 2708, 'Sacramento': 3003, 'San Diego': 2857, 'New York': 215, 'Philadelphia': 310, 'Portland': 110, 'Phoenix': 2613 },
      'Philadelphia': { 'Los Angeles': 2714, 'San Francisco': 2830, 'Las Vegas': 2445, 'Sacramento': 2740, 'San Diego': 2594, 'New York': 95, 'Boston': 310, 'Portland': 2549, 'Phoenix': 2350 },
      'Portland': { 'Los Angeles': 960, 'San Francisco': 635, 'Las Vegas': 1118, 'Sacramento': 580, 'San Diego': 1255, 'New York': 2454, 'Boston': 110, 'Philadelphia': 2549, 'Phoenix': 1485 },
      'Phoenix': { 'Los Angeles': 370, 'San Francisco': 756, 'Las Vegas': 300, 'Sacramento': 756, 'San Diego': 355, 'New York': 2425, 'Boston': 2613, 'Philadelphia': 2350, 'Portland': 1485 }
    };

    for (const origin of locations) {
      for (const destination of locations) {
        if (origin !== destination) {
          const price = basePrices[origin]?.[destination] || 50;
          const distance = distances[origin]?.[destination] || 100;
          const existing = await client.query(
            'SELECT id FROM routes WHERE origin = $1 AND destination = $2',
            [origin, destination]
          );
          if (existing.rows.length === 0) {
            await client.query(
              'INSERT INTO routes (origin, destination, distance_miles, base_price) VALUES ($1, $2, $3, $4)',
              [origin, destination, distance, price]
            );
          }
        }
      }
    }

    const routeResult = await client.query('SELECT id FROM routes ORDER BY id');
    const routes = routeResult.rows;

    const scheduleTimes = [
      ['06:00:00', '10:30:00'],
      ['08:00:00', '12:30:00'],
      ['10:00:00', '14:30:00'],
      ['12:00:00', '16:30:00'],
      ['14:00:00', '18:30:00'],
      ['16:00:00', '20:30:00'],
      ['18:00:00', '22:30:00']
    ];

    for (const route of routes) {
      const existingSchedules = await client.query(
        'SELECT id FROM schedules WHERE route_id = $1',
        [route.id]
      );
      if (existingSchedules.rows.length === 0) {
        for (const [departure, arrival] of scheduleTimes) {
          await client.query(
            'INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES ($1, $2, $3, NULL)',
            [route.id, departure, arrival]
          );
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

  const today = new Date('2025-12-18T00:00:00');
  today.setHours(0, 0, 0, 0);

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = getDateString(date);

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
        let availableSeats = totalSeats;

        if (day === 0) {
          const existingInventory = await client.query(
            `SELECT id FROM inventory WHERE schedule_id = $1 AND date = $2`,
            [schedule.id, dateStr]
          );
          
          if (existingInventory.rows.length > 0) {
            const inventoryId = existingInventory.rows[0].id;
            const reservedCount = await client.query(
              `SELECT COUNT(*) as count FROM reservations 
               WHERE inventory_id = $1 AND status != 'cancelled'`,
              [inventoryId]
            );
            const reserved = parseInt(reservedCount.rows[0]?.count || 0);
            availableSeats = Math.max(0, totalSeats - reserved);
          }

          await client.query(
            `INSERT INTO inventory (schedule_id, date, total_seats, available_seats, price_modifier)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (schedule_id, date) 
             DO UPDATE SET 
               total_seats = $3,
               available_seats = $4,
               price_modifier = $5`,
            [schedule.id, dateStr, totalSeats, availableSeats, priceModifier]
          );
        } else {
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
}

initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.exit(1);
  });