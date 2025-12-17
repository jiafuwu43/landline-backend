const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const bookings = await db.all(
      `SELECT r.*, s.departure_time, s.arrival_time, 
              inv.date as booking_date,
              rt.origin, rt.destination, rt.base_price
       FROM reservations r
       JOIN schedules s ON r.schedule_id = s.id
       JOIN inventory inv ON r.inventory_id = inv.id
       JOIN routes rt ON s.route_id = rt.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { inventory_id, passenger_name, passenger_email, seat_number, seat_level } = req.body;
    
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
      }
    }

    if (!inventory_id || !passenger_name || !passenger_email) {
      return res.status(400).json({
        error: 'Missing required fields: inventory_id, passenger_name, passenger_email',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passenger_email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    const result = await db.transaction(async (db) => {
      const inventory = await db.get(
        `SELECT i.id, i.schedule_id, i.date, i.available_seats, i.price_modifier,
                s.route_id, r.base_price
         FROM inventory i
         JOIN schedules s ON i.schedule_id = s.id
         JOIN routes r ON s.route_id = r.id
         WHERE i.id = $1 FOR UPDATE`,
        [inventory_id]
      );

      if (!inventory) {
        throw { status: 404, message: 'Inventory not found' };
      }

      if (inventory.available_seats <= 0) {
        throw { status: 409, message: 'No seats available' };
      }

      if (seat_number !== undefined && seat_number !== null) {
        const existingReservation = await db.get(
          `SELECT id FROM reservations 
           WHERE inventory_id = $1 AND seat_number = $2 AND status != 'cancelled'`,
          [inventory_id, seat_number]
        );

        if (existingReservation) {
          throw { status: 409, message: 'Seat already taken' };
        }
      }
      
      if (seat_level !== undefined && seat_level !== null) {
        if (![1, 2, 3].includes(seat_level)) {
          throw { status: 400, message: 'Seat level must be 1, 2, or 3' };
        }
      }

      await db.run(
        'UPDATE inventory SET available_seats = available_seats - 1 WHERE id = $1',
        [inventory_id]
      );

      const price = inventory.base_price * inventory.price_modifier;
      const insertResult = await db.run(
        `INSERT INTO reservations 
         (user_id, schedule_id, inventory_id, passenger_name, passenger_email, seat_number, seat_level, booking_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed')
         RETURNING id`,
        [
          userId,
          inventory.schedule_id,
          inventory_id,
          passenger_name,
          passenger_email,
          seat_number || null,
          seat_level || null,
          inventory.date,
        ]
      );

      return {
        reservation_id: insertResult.lastID,
        schedule_id: inventory.schedule_id,
        inventory_id: inventory_id,
        price: Math.round(price * 100) / 100,
      };
    });

    const reservation = await db.get(
      `SELECT r.*, s.departure_time, s.arrival_time
       FROM reservations r
       JOIN schedules s ON r.schedule_id = s.id
       WHERE r.id = $1`,
      [result.reservation_id]
    );

    res.status(201).json({
      id: reservation.id,
      schedule_id: reservation.schedule_id,
      inventory_id: reservation.inventory_id,
      passenger_name: reservation.passenger_name,
      passenger_email: reservation.passenger_email,
      seat_number: reservation.seat_number,
      status: reservation.status,
      booking_date: reservation.booking_date,
      departure_time: reservation.departure_time,
      arrival_time: reservation.arrival_time,
      price: result.price,
      created_at: reservation.created_at,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { seat_number, passenger_name, passenger_email } = req.body;

    if (isNaN(bookingId)) {
      return res.status(400).json({
        error: 'Invalid booking ID',
      });
    }

    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = $1',
      [bookingId]
    );

    if (!reservation) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot modify a cancelled booking',
      });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;
    const modifications = [];

    if (seat_number !== undefined && seat_number !== reservation.seat_number) {
      const existingReservation = await db.get(
        `SELECT id FROM reservations 
         WHERE inventory_id = $1 AND seat_number = $2 AND id != $3 AND status != 'cancelled'`,
        [reservation.inventory_id, seat_number, bookingId]
      );

      if (existingReservation) {
        return res.status(409).json({
          error: 'Seat already taken',
        });
      }

      updates.push(`seat_number = $${paramIndex}`);
      params.push(seat_number);
      paramIndex++;
      modifications.push({
        type: 'seat_changed',
        old_value: reservation.seat_number?.toString() || 'null',
        new_value: seat_number.toString(),
      });
    }

    if (passenger_name && passenger_name !== reservation.passenger_name) {
      updates.push(`passenger_name = $${paramIndex}`);
      params.push(passenger_name);
      paramIndex++;
      modifications.push({
        type: 'passenger_updated',
        old_value: reservation.passenger_name,
        new_value: passenger_name,
      });
    }

    if (passenger_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(passenger_email)) {
        return res.status(400).json({
          error: 'Invalid email format',
        });
      }

      if (passenger_email !== reservation.passenger_email) {
        updates.push(`passenger_email = $${paramIndex}`);
        params.push(passenger_email);
        paramIndex++;
        modifications.push({
          type: 'passenger_updated',
          old_value: reservation.passenger_email,
          new_value: passenger_email,
        });
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
      });
    }

    updates.push(`status = $${paramIndex}`, 'updated_at = CURRENT_TIMESTAMP');
    params.push('modified');
    paramIndex++;
    params.push(bookingId);

    await db.run(
      `UPDATE reservations SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    for (const mod of modifications) {
      await db.run(
        `INSERT INTO booking_modifications (reservation_id, modification_type, old_value, new_value)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, mod.type, mod.old_value, mod.new_value]
      );
    }

    const updatedReservation = await db.get(
      `SELECT r.*, s.departure_time, s.arrival_time
       FROM reservations r
       JOIN schedules s ON r.schedule_id = s.id
       WHERE r.id = $1`,
      [bookingId]
    );

    res.json(updatedReservation);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        error: 'Invalid booking ID',
      });
    }

    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = $1',
      [bookingId]
    );

    if (!reservation) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        error: 'Booking already cancelled',
      });
    }

    await db.transaction(async (db) => {
      await db.run(
        "UPDATE reservations SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [bookingId]
      );

      await db.run(
        'UPDATE inventory SET available_seats = available_seats + 1 WHERE id = $1',
        [reservation.inventory_id]
      );

      await db.run(
        `INSERT INTO booking_modifications (reservation_id, modification_type, old_value, new_value)
         VALUES ($1, 'cancelled', $2, 'cancelled')`,
        [bookingId, reservation.status]
      );
    });

    const cancelledReservation = await db.get(
      'SELECT * FROM reservations WHERE id = $1',
      [bookingId]
    );

    res.json({
      id: cancelledReservation.id,
      status: cancelledReservation.status,
      cancelled_at: cancelledReservation.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;