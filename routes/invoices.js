const express = require('express');
const router = express.Router();
const { runQuery, getAll, getOne } = require('../database');

// Generate invoice number
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PARV-${year}${month}-${random}`;
}

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const invoices = await getAll(`
            SELECT i.*, c.name as client_name, c.email as client_email
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            ORDER BY i.created_at DESC
        `);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single invoice with items
router.get('/:id', async (req, res) => {
    try {
        const invoice = await getOne(`
            SELECT i.*, c.name as client_name, c.email as client_email, 
                   c.phone as client_phone, c.address as client_address,
                   c.city as client_city, c.country as client_country,
                   c.gst_number as client_gst_number
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            WHERE i.id = ?
        `, [req.params.id]);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const items = await getAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
        invoice.items = items;
        
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    try {
        const { client_id, invoice_date, due_date, tax_rate, notes, items } = req.body;
        
        if (!client_id) {
            return res.status(400).json({ error: 'Client is required' });
        }

        const invoice_number = generateInvoiceNumber();
        const taxRateValue = tax_rate || 18;
        
        // Calculate totals
        let subtotal = 0;
        if (items && items.length > 0) {
            subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        }
        const tax_amount = (subtotal * taxRateValue) / 100;
        const total = subtotal + tax_amount;

        const result = await runQuery(
            `INSERT INTO invoices (invoice_number, client_id, invoice_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoice_number, client_id, invoice_date || new Date().toISOString().split('T')[0], due_date, subtotal, taxRateValue, tax_amount, total, notes]
        );

        const invoiceId = result.lastID;

        // Insert invoice items
        if (items && items.length > 0) {
            for (const item of items) {
                const itemTotal = item.quantity * item.unit_price;
                await runQuery(
                    `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
                     VALUES (?, ?, ?, ?, ?)`,
                    [invoiceId, item.description, item.quantity, item.unit_price, itemTotal]
                );
            }
        }

        const newInvoice = await getOne('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update invoice
router.put('/:id', async (req, res) => {
    try {
        const { client_id, invoice_date, due_date, tax_rate, status, notes, items } = req.body;
        const taxRateValue = tax_rate || 18;
        
        // Calculate totals
        let subtotal = 0;
        if (items && items.length > 0) {
            subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        }
        const tax_amount = (subtotal * taxRateValue) / 100;
        const total = subtotal + tax_amount;

        await runQuery(
            `UPDATE invoices SET client_id = ?, invoice_date = ?, due_date = ?, 
             subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, status = ?, notes = ?
             WHERE id = ?`,
            [client_id, invoice_date, due_date, subtotal, taxRateValue, tax_amount, total, status, notes, req.params.id]
        );

        // Delete existing items and insert new ones
        await runQuery('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
        
        if (items && items.length > 0) {
            for (const item of items) {
                const itemTotal = item.quantity * item.unit_price;
                await runQuery(
                    `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.params.id, item.description, item.quantity, item.unit_price, itemTotal]
                );
            }
        }

        const updatedInvoice = await getOne('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        await runQuery('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
        
        const updatedInvoice = await getOne('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
        await runQuery('DELETE FROM invoices WHERE id = ?', [req.params.id]);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
