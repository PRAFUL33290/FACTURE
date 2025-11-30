const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { getOne, getAll } = require('../database');

// Generate PDF for invoice
router.get('/invoice/:id', async (req, res) => {
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

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
        
        doc.pipe(res);

        // Header - Company Logo and Name
        doc.fontSize(28).fillColor('#2563eb').font('Helvetica-Bold')
           .text('PARVATI INDIA', 50, 50);
        
        doc.fontSize(10).fillColor('#666').font('Helvetica')
           .text('Invoice Management System', 50, 85);
        
        // Invoice Title
        doc.fontSize(24).fillColor('#1f2937').font('Helvetica-Bold')
           .text('INVOICE', 400, 50, { align: 'right' });
        
        doc.fontSize(12).fillColor('#666').font('Helvetica')
           .text(`#${invoice.invoice_number}`, 400, 80, { align: 'right' });

        // Line separator
        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e5e7eb').stroke();

        // Bill To and Invoice Details
        doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold')
           .text('Bill To:', 50, 130);
        
        doc.fontSize(11).fillColor('#374151').font('Helvetica')
           .text(invoice.client_name || 'N/A', 50, 150)
           .text(invoice.client_address || '', 50, 165)
           .text(`${invoice.client_city || ''} ${invoice.client_country || ''}`, 50, 180);
        
        if (invoice.client_phone) {
            doc.text(`Phone: ${invoice.client_phone}`, 50, 195);
        }
        if (invoice.client_email) {
            doc.text(`Email: ${invoice.client_email}`, 50, 210);
        }
        if (invoice.client_gst_number) {
            doc.text(`GST: ${invoice.client_gst_number}`, 50, 225);
        }

        // Invoice details on right
        doc.fontSize(11).fillColor('#374151').font('Helvetica')
           .text(`Invoice Date: ${invoice.invoice_date || 'N/A'}`, 350, 130, { align: 'right' })
           .text(`Due Date: ${invoice.due_date || 'N/A'}`, 350, 150, { align: 'right' })
           .text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, 350, 170, { align: 'right' });

        // Items table header
        const tableTop = 260;
        doc.rect(50, tableTop, 500, 25).fillColor('#2563eb').fill();
        
        doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
           .text('Description', 60, tableTop + 8)
           .text('Qty', 320, tableTop + 8, { width: 50, align: 'center' })
           .text('Unit Price', 370, tableTop + 8, { width: 80, align: 'right' })
           .text('Total', 460, tableTop + 8, { width: 80, align: 'right' });

        // Items
        let yPosition = tableTop + 30;
        doc.fillColor('#374151').font('Helvetica');
        
        items.forEach((item, index) => {
            const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
            doc.rect(50, yPosition - 5, 500, 25).fillColor(bgColor).fill();
            
            doc.fillColor('#374151').fontSize(10)
               .text(item.description, 60, yPosition + 3, { width: 250 })
               .text(item.quantity.toString(), 320, yPosition + 3, { width: 50, align: 'center' })
               .text(`₹${item.unit_price.toFixed(2)}`, 370, yPosition + 3, { width: 80, align: 'right' })
               .text(`₹${item.total.toFixed(2)}`, 460, yPosition + 3, { width: 80, align: 'right' });
            
            yPosition += 25;
        });

        // Totals
        yPosition += 20;
        doc.moveTo(350, yPosition).lineTo(550, yPosition).strokeColor('#e5e7eb').stroke();
        
        yPosition += 15;
        doc.fontSize(11).fillColor('#374151').font('Helvetica')
           .text('Subtotal:', 350, yPosition)
           .text(`₹${invoice.subtotal.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
        
        yPosition += 20;
        doc.text(`Tax (${invoice.tax_rate}%):`, 350, yPosition)
           .text(`₹${invoice.tax_amount.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
        
        yPosition += 25;
        doc.moveTo(350, yPosition).lineTo(550, yPosition).strokeColor('#2563eb').lineWidth(2).stroke();
        
        yPosition += 10;
        doc.fontSize(14).fillColor('#2563eb').font('Helvetica-Bold')
           .text('Total:', 350, yPosition)
           .text(`₹${invoice.total.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });

        // Notes
        if (invoice.notes) {
            yPosition += 50;
            doc.fontSize(11).fillColor('#1f2937').font('Helvetica-Bold')
               .text('Notes:', 50, yPosition);
            doc.fontSize(10).fillColor('#374151').font('Helvetica')
               .text(invoice.notes, 50, yPosition + 18, { width: 500 });
        }

        // Footer
        doc.fontSize(9).fillColor('#9ca3af').font('Helvetica')
           .text('Thank you for your business!', 50, 720, { align: 'center', width: 500 })
           .text('PARVATI INDIA - Invoice Management System', 50, 735, { align: 'center', width: 500 });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
