const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/services — Public: Fetch all active services
router.get('/services', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// GET /api/admin/services — Admin: Fetch ALL services (including inactive)
router.get('/admin/services', authMiddleware, async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM services ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin fetch services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// POST /api/admin/services — Admin: Create a service
router.post('/admin/services', authMiddleware, upload.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, is_active } = req.body;
    const image_url = req.file ? `/uploads/services/${req.file.filename}` : null;

    const [result] = await getPool().query(
      'INSERT INTO services (title, description, image_url, is_active) VALUES (?, ?, ?, ?)',
      [title, description || '', image_url, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { id: result.insertId, title, description, image_url, is_active: true }
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
});

// PUT /api/admin/services/:id — Admin: Update a service
router.put('/admin/services/:id', authMiddleware, upload.single('image'), [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_active } = req.body;

    // Check if service exists
    const [existing] = await getPool().query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const image_url = req.file 
      ? `/uploads/services/${req.file.filename}` 
      : existing[0].image_url;

    await getPool().query(
      'UPDATE services SET title = ?, description = ?, image_url = ?, is_active = ? WHERE id = ?',
      [
        title || existing[0].title,
        description !== undefined ? description : existing[0].description,
        image_url,
        is_active !== undefined ? is_active : existing[0].is_active,
        id
      ]
    );

    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

// DELETE /api/admin/services/:id — Admin: Delete a service
router.delete('/admin/services/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await getPool().query('DELETE FROM services WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

module.exports = router;
