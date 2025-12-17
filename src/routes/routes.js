const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.get('/', async (req, res, next) => {
  try {
    const routes = await db.all('SELECT * FROM routes ORDER BY origin, destination');
    res.json(routes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;