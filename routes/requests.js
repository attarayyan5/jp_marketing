const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// POST /api/requests — Public: Submit a work request
router.post('/requests', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address'),
  body('mobile_no')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters'),
  body('map_link')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Please enter a valid URL for the map link'),
  body('the_work')
    .trim()
    .notEmpty().withMessage('Work description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Work description must be 10-2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, mobile_no, address, map_link, the_work } = req.body;

    const [result] = await getPool().query(
      'INSERT INTO work_requests (name, email, mobile_no, address, map_link, the_work) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email || '', mobile_no, address, map_link || '', the_work]
    );

    res.status(201).json({
      success: true,
      message: 'Work request submitted successfully! We will contact you soon.',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit work request' });
  }
});

// GET /api/admin/requests — Admin: Fetch all requests with optional filtering
router.get('/admin/requests', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM work_requests';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(name LIKE ? OR mobile_no LIKE ? OR address LIKE ? OR the_work LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await getPool().query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin fetch requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// PUT /api/admin/requests/:id/status — Admin: Update request status
router.put('/admin/requests/:id/status', authMiddleware, [
  body('status')
    .isIn(['Pending', 'Contacted', 'Completed'])
    .withMessage('Status must be Pending, Contacted, or Completed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const [result] = await getPool().query(
      'UPDATE work_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, message: `Request status updated to ${status}` });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update request status' });
  }
});

// GET /api/admin/stats — Admin: Dashboard statistics
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const [[{ totalServices }]] = await getPool().query('SELECT COUNT(*) as totalServices FROM services');
    const [[{ activeServices }]] = await getPool().query('SELECT COUNT(*) as activeServices FROM services WHERE is_active = TRUE');
    const [[{ totalSites }]] = await getPool().query('SELECT COUNT(*) as totalSites FROM visited_sites');
    const [[{ totalRequests }]] = await getPool().query('SELECT COUNT(*) as totalRequests FROM work_requests');
    const [[{ pendingRequests }]] = await getPool().query("SELECT COUNT(*) as pendingRequests FROM work_requests WHERE status = 'Pending'");
    const [[{ contactedRequests }]] = await getPool().query("SELECT COUNT(*) as contactedRequests FROM work_requests WHERE status = 'Contacted'");
    const [[{ completedRequests }]] = await getPool().query("SELECT COUNT(*) as completedRequests FROM work_requests WHERE status = 'Completed'");
    const [[{ totalPricing }]] = await getPool().query('SELECT COUNT(*) as totalPricing FROM pricing');

    res.json({
      success: true,
      data: {
        totalServices,
        activeServices,
        totalSites,
        totalRequests,
        pendingRequests,
        contactedRequests,
        completedRequests,
        totalPricing
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
