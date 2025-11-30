const express = require('express');
const router = express.Router();
const { runQuery, getAll, getOne } = require('../database');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const clients = await getAll('SELECT * FROM clients ORDER BY name');
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const client = await getOne('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create client
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, city, country, gst_number } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await runQuery(
            `INSERT INTO clients (name, email, phone, address, city, country, gst_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, address, city, country || 'India', gst_number]
        );
        
        const newClient = await getOne('SELECT * FROM clients WHERE id = ?', [result.lastID]);
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, address, city, country, gst_number } = req.body;
        
        await runQuery(
            `UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, gst_number = ? WHERE id = ?`,
            [name, email, phone, address, city, country, gst_number, req.params.id]
        );
        
        const updatedClient = await getOne('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        res.json(updatedClient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM clients WHERE id = ?', [req.params.id]);
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
