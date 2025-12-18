const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/search', async (req, res, next) => {
  try {
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: origin, destination, date',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const route = await db.get(
      'SELECT id, base_price FROM routes WHERE origin = $1 AND destination = $2',
      [origin, destination]
    );

    if (!route) {
      return res.status(404).json({
        error: 'Route not found',
      });
    }

    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    const schedules = await db.all(
      `SELECT s.id as schedule_id, s.departure_time, s.arrival_time
       FROM schedules s
       WHERE s.route_id = $1 AND (s.day_of_week IS NULL OR s.day_of_week = $2)
       ORDER BY s.departure_time`,
      [route.id, dayOfWeek]
    );

    const results = [];
    for (const schedule of schedules) {
      const inventory = await db.get(
        `SELECT i.id as inventory_id, i.available_seats, i.price_modifier, i.total_seats
         FROM inventory i
         WHERE i.schedule_id = $1 AND i.date = $2`,
        [schedule.schedule_id, date]
      );

      if (inventory && inventory.available_seats > 0) {
        const price = route.base_price * inventory.price_modifier;
        results.push({
          schedule_id: schedule.schedule_id,
          inventory_id: inventory.inventory_id,
          departure_time: schedule.departure_time,
          arrival_time: schedule.arrival_time,
          available_seats: inventory.available_seats,
          total_seats: inventory.total_seats,
          price: Math.round(price * 100) / 100,
          date: date,
        });
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const inventoryId = parseInt(req.params.id);

    if (isNaN(inventoryId)) {
      return res.status(400).json({
        error: 'Invalid inventory ID',
      });
    }

    const inventory = await db.get(
      `SELECT i.id as inventory_id, i.schedule_id, i.date, i.total_seats, 
              i.available_seats, i.price_modifier,
              s.departure_time, s.arrival_time,
              r.base_price
       FROM inventory i
       JOIN schedules s ON i.schedule_id = s.id
       JOIN routes r ON s.route_id = r.id
       WHERE i.id = $1`,
      [inventoryId]
    );

    if (!inventory) {
      return res.status(404).json({
        error: 'Inventory not found',
      });
    }

    const price = inventory.base_price * inventory.price_modifier;

    res.json({
      inventory_id: inventory.inventory_id,
      schedule_id: inventory.schedule_id,
      date: inventory.date,
      total_seats: inventory.total_seats,
      available_seats: inventory.available_seats,
      price: Math.round(price * 100) / 100,
      departure_time: inventory.departure_time,
      arrival_time: inventory.arrival_time,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/seats', async (req, res, next) => {
  try {
    const inventoryId = parseInt(req.params.id);

    if (isNaN(inventoryId)) {
      return res.status(400).json({
        error: 'Invalid inventory ID',
      });
    }

    const totalSeats = 14;
    const seats = [];
    
    const reservedSeats = await db.all(
      `SELECT seat_number, seat_level 
       FROM reservations 
       WHERE inventory_id = $1 AND status != 'cancelled' AND seat_number IS NOT NULL`,
      [inventoryId]
    );
    
    const reservedSeatNumbers = new Set(
      reservedSeats
        .map(r => r.seat_number)
        .filter(num => num !== null && num !== undefined)
    );
    
    for (let seatNum = 1; seatNum <= totalSeats; seatNum++) {
      let level;
      if (seatNum <= 5) level = 1;
      else if (seatNum <= 10) level = 2;
      else level = 3;
      
      const isReserved = reservedSeatNumbers.has(seatNum);
      
      seats.push({
        seat_number: seatNum,
        level: level,
        available: !isReserved,
      });
    }
    
    const seatsByLevel = {
      1: seats.filter(s => s.level === 1),
      2: seats.filter(s => s.level === 2),
      3: seats.filter(s => s.level === 3),
    };

    res.json(seatsByLevel);
  } catch (err) {
    next(err);
  }
});

module.exports = router;