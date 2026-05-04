const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// GET /api/pricing — Public: Fetch all pricing
router.get('/pricing', async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM pricing ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing' });
  }
});

// GET /api/admin/pricing — Admin: Fetch all pricing
router.get('/admin/pricing', authMiddleware, async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM pricing ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin fetch pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing' });
  }
});

// POST /api/admin/pricing — Admin: Create pricing entry
router.post('/admin/pricing', authMiddleware, [
  body('service_name').trim().notEmpty().withMessage('Service name is required'),
  body('cost_estimate').trim().notEmpty().withMessage('Cost estimate is required'),
  body('details').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { service_name, cost_estimate, details } = req.body;

    const [result] = await getPool().query(
      'INSERT INTO pricing (service_name, cost_estimate, details) VALUES (?, ?, ?)',
      [service_name, cost_estimate, details || '']
    );

    res.status(201).json({
      success: true,
      message: 'Pricing entry created successfully',
      data: { id: result.insertId, service_name, cost_estimate, details }
    });
  } catch (error) {
    console.error('Create pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to create pricing' });
  }
});

// PUT /api/admin/pricing/:id — Admin: Update pricing
router.put('/admin/pricing/:id', authMiddleware, [
  body('service_name').optional().trim().notEmpty(),
  body('cost_estimate').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, cost_estimate, details } = req.body;

    const [existing] = await getPool().query('SELECT * FROM pricing WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing entry not found' });
    }

    await getPool().query(
      'UPDATE pricing SET service_name = ?, cost_estimate = ?, details = ? WHERE id = ?',
      [
        service_name || existing[0].service_name,
        cost_estimate || existing[0].cost_estimate,
        details !== undefined ? details : existing[0].details,
        id
      ]
    );

    res.json({ success: true, message: 'Pricing updated successfully' });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to update pricing' });
  }
});

// DELETE /api/admin/pricing/:id — Admin: Delete pricing
router.delete('/admin/pricing/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await getPool().query('DELETE FROM pricing WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pricing entry not found' });
    }

    res.json({ success: true, message: 'Pricing entry deleted successfully' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete pricing' });
  }
});

module.exports = router;
