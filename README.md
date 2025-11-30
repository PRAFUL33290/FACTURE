# PARVATI INDIA - Invoice Management System

A complete SaaS application for managing invoices with PDF generation.

## Features

- 📊 **Dashboard** - Overview of invoices, clients, and revenue statistics
- 📄 **Invoice Management** - Create, edit, delete, and track invoices
- 👥 **Client Management** - Manage your client database
- 📥 **PDF Generation** - Professional invoice PDF export with PARVATI INDIA branding
- 💰 **Tax Calculation** - Automatic GST tax calculation
- 📈 **Status Tracking** - Track invoice status (Draft, Pending, Paid, Cancelled)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Frontend**: HTML5, TailwindCSS, JavaScript
- **PDF Generation**: PDFKit

## Installation

```bash
# Clone the repository
git clone https://github.com/PRAFUL33290/FACTURE.git
cd FACTURE

# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get single invoice with items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `PATCH /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### PDF
- `GET /api/pdf/invoice/:id` - Download invoice as PDF

## Database Schema

### Clients Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Client name |
| email | TEXT | Email address |
| phone | TEXT | Phone number |
| address | TEXT | Street address |
| city | TEXT | City |
| country | TEXT | Country (default: India) |
| gst_number | TEXT | GST registration number |
| created_at | DATETIME | Creation timestamp |

### Invoices Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| invoice_number | TEXT | Unique invoice number (PARV-YYYYMM-XXXX) |
| client_id | INTEGER | Foreign key to clients |
| invoice_date | DATE | Invoice date |
| due_date | DATE | Payment due date |
| subtotal | REAL | Subtotal amount |
| tax_rate | REAL | Tax percentage (default: 18%) |
| tax_amount | REAL | Calculated tax amount |
| total | REAL | Total amount |
| status | TEXT | Invoice status |
| notes | TEXT | Additional notes |
| created_at | DATETIME | Creation timestamp |

### Invoice Items Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| invoice_id | INTEGER | Foreign key to invoices |
| description | TEXT | Item description |
| quantity | INTEGER | Quantity |
| unit_price | REAL | Price per unit |
| total | REAL | Line total |

## License

MIT License - PARVATI INDIA
