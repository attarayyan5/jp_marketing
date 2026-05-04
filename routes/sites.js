const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/sites — Public: Fetch all portfolio sites
router.get('/sites', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      'SELECT * FROM visited_sites ORDER BY completion_date DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch sites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sites' });
  }
});

// GET /api/admin/sites — Admin: Fetch all sites
router.get('/admin/sites', authMiddleware, async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM visited_sites ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin fetch sites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sites' });
  }
});

// POST /api/admin/sites — Admin: Create a site entry
router.post('/admin/sites', authMiddleware, upload.single('image'), [
  body('client_name').trim().notEmpty().withMessage('Client name is required'),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('completion_date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { client_name, location, description, completion_date } = req.body;
    const image_url = req.file ? `/uploads/sites/${req.file.filename}` : null;

    const [result] = await getPool().query(
      'INSERT INTO visited_sites (client_name, location, description, image_url, completion_date) VALUES (?, ?, ?, ?, ?)',
      [client_name, location || '', description || '', image_url, completion_date || null]
    );

    res.status(201).json({
      success: true,
      message: 'Site added successfully',
      data: { id: result.insertId, client_name, location, description, image_url, completion_date }
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ success: false, message: 'Failed to create site' });
  }
});

// PUT /api/admin/sites/:id — Admin: Update a site
router.put('/admin/sites/:id', authMiddleware, upload.single('image'), [
  body('client_name').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, location, description, completion_date } = req.body;

    const [existing] = await getPool().query('SELECT * FROM visited_sites WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const image_url = req.file 
      ? `/uploads/sites/${req.file.filename}` 
      : existing[0].image_url;

    await getPool().query(
      'UPDATE visited_sites SET client_name = ?, location = ?, description = ?, image_url = ?, completion_date = ? WHERE id = ?',
      [
        client_name || existing[0].client_name,
        location !== undefined ? location : existing[0].location,
        description !== undefined ? description : existing[0].description,
        image_url,
        completion_date || existing[0].completion_date,
        id
      ]
    );

    res.json({ success: true, message: 'Site updated successfully' });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ success: false, message: 'Failed to update site' });
  }
});

// DELETE /api/admin/sites/:id — Admin: Delete a site
router.delete('/admin/sites/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await getPool().query('DELETE FROM visited_sites WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete site' });
  }
});

module.exports = router;
