const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8081;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend UI static files
app.use(express.static(path.join(__dirname, 'src/main/resources')));

// Product Catalog Database
const catalog = {
    "WT001": { productId: "WT001", name: "Royal Silk Top (Gucci)", price: 8500, stock: 10, category: "WOMEN" },
    "WT002": { productId: "WT002", name: "Luxury Cashmere Top (Prada)", price: 12000, stock: 8, category: "WOMEN" },
    "WD001": { productId: "WD001", name: "Royal Evening Gown (Dior)", price: 18000, stock: 6, category: "WOMEN" },
    "WK001": { productId: "WK001", name: "Royal Embroidered Kurti (Gucci)", price: 7500, stock: 8, category: "WOMEN" },
    "WJKT001": { productId: "WJKT001", name: "Women Leather Jacket (Gucci)", price: 28000, stock: 5, category: "WOMEN" },
    "WJ001": { productId: "WJ001", name: "Premium Slim Fit Jeans (Gucci)", price: 7500, stock: 9, category: "WOMEN" },
    "MS001": { productId: "MS001", name: "Royal Oxford Shirt (Gucci)", price: 8500, stock: 12, category: "MEN" },
    "MS002": { productId: "MS002", name: "Luxury Silk Shirt (Prada)", price: 15000, stock: 6, category: "MEN" },
    "MP001": { productId: "MP001", name: "Tailored Wool Trousers (Gucci)", price: 9000, stock: 10, category: "MEN" },
    "MJKT001": { productId: "MJKT001", name: "Men Leather Jacket (Gucci)", price: 30000, stock: 7, category: "MEN" },
    "MH001": { productId: "MH001", name: "Luxury Cashmere Hoodie (Gucci)", price: 15000, stock: 8, category: "MEN" },
    "MSW001": { productId: "MSW001", name: "Cashmere Sweatshirt (Gucci)", price: 12000, stock: 10, category: "MEN" },
    "PROD123": { productId: "PROD123", name: "Italian Silk Tuxedo", price: 45000, stock: 10, category: "MEN" },
    "PROD456": { productId: "PROD456", name: "Luxury Leather Belt", price: 800, stock: 2, category: "ACCESSORIES" }
};

// Healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'MuleSoft Order Management Backend', timestamp: new Date().toISOString() });
});

// Serve UI on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/main/resources/index.html'));
});

// 1. Customer Registration / Profile Mapping API
app.post('/api/customers', (req, res) => {
    const payload = req.body || {};
    const customer = {
        customerId: payload.customerId || "CUST001",
        name: payload.name || "VIP Customer",
        email: payload.email || "sramakrishnan2196@gmail.com",
        mappedAt: new Date().toISOString()
    };
    console.log(`[MuleSoft API] Customer registered: ${customer.customerId} (${customer.email})`);
    res.status(200).json({
        success: true,
        message: "Customer profile mapped successfully in directory",
        customer
    });
});

// 2. Mock Product Availability API
app.get('/api/mock/products/:productId', (req, res) => {
    const pid = req.params.productId;
    if (catalog[pid]) {
        return res.json(catalog[pid]);
    }
    if (pid.startsWith("OUT_OF_STOCK")) {
        return res.json({ productId: pid, name: "Out of Stock Item", price: 5000, stock: 0 });
    }
    if (pid.startsWith("INVALID")) {
        return res.status(404).json({ error: "Product not found" });
    }
    // Dynamic fallback for custom products
    return res.json({
        productId: pid,
        name: `Luxury Designer Item (${pid})`,
        price: 9500,
        stock: 15,
        category: "LUXURY"
    });
});

// 3. Mock Order Creation API
app.post('/api/mock/orders', (req, res) => {
    const orderId = 'LUX-ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    res.json({
        ...req.body,
        orderId
    });
});

// 4. Mock Notification API
app.post('/api/mock/notifications', (req, res) => {
    console.log('[Mock Notification]', req.body);
    res.json({ status: "Notification Delivered" });
});

// 5. Main Order Processing API (Mirrors MuleSoft DataWeave Business Logic)
app.post('/api/orders', async (req, res) => {
    try {
        const orderReq = req.body || {};
        const customerId = orderReq.customerId || "CUST001";
        const customerName = orderReq.customerName || "VIP Customer";
        const targetEmail = orderReq.customerEmail || "sramakrishnan2196@gmail.com";

        // Multi-item cart support or single item fallback
        let items = [];
        if (orderReq.cartItems && Array.isArray(orderReq.cartItems) && orderReq.cartItems.length > 0) {
            items = orderReq.cartItems.map(item => ({
                productId: item.productId,
                productName: item.productName || (catalog[item.productId] ? catalog[item.productId].name : `Item ${item.productId}`),
                price: Number(item.price) || (catalog[item.productId] ? catalog[item.productId].price : 5000),
                quantity: Number(item.quantity) || 1
            }));
        } else {
            const pid = orderReq.productId || "WT001";
            const qty = Number(orderReq.quantity) || 1;
            const product = catalog[pid] || { productId: pid, name: `Luxury Item (${pid})`, price: 8500, stock: 10 };
            items = [{
                productId: pid,
                productName: product.name,
                price: product.price,
                quantity: qty
            }];
        }

        // Check stock availability
        for (const item of items) {
            const prod = catalog[item.productId];
            if (prod && prod.stock !== undefined && prod.stock < item.quantity) {
                return res.status(409).json({
                    success: false,
                    errorType: "APP:OUT_OF_STOCK",
                    message: `Item ${item.productName} is out of stock (Available: ${prod.stock}, Requested: ${item.quantity}).`
                });
            }
        }

        // Subtotal Calculation
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // 10% VIP Discount Rule: If subtotal > 10,000, apply 10% privilege discount
        const discount = subtotal > 10000 ? Math.round(subtotal * 0.10) : 0;
        const discountedSubtotal = subtotal - discount;

        // 5% Luxury Goods Tax (GST)
        const tax = Math.round(discountedSubtotal * 0.05);

        // Shipping: Free if subtotal > 50,000, else standard ₹250
        const shipping = subtotal > 50000 ? 0 : 250;

        // Final Total
        const totalAmount = discountedSubtotal + tax + shipping;

        const orderId = 'LUX-ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        const orderDetails = {
            orderId,
            customerId,
            customerName,
            customerEmail: targetEmail,
            items,
            subtotal,
            discount,
            tax,
            shipping,
            totalAmount,
            status: "CONFIRMED",
            timestamp: new Date().toISOString()
        };

        // Try dispatching email invoice (Graceful fallback like MuleSoft on-error-continue)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER || 'mulesoftautomatedbot@gmail.com',
                    pass: process.env.SMTP_PASS || 'default_pass'
                }
            });

            await transporter.sendMail({
                from: `"AURA Luxury Maison" <${process.env.SMTP_USER || 'mulesoftautomatedbot@gmail.com'}>`,
                to: targetEmail,
                subject: `AURA Order Confirmation & Tax Invoice - ${orderId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
                        <h2 style="color: #38bdf8;">AURA Luxury Order Confirmation</h2>
                        <p>Dear <strong>${customerName}</strong>,</p>
                        <p>Thank you for your purchase! Your invoice has been generated successfully.</p>
                        <p><strong>Order ID:</strong> ${orderId}<br/>
                        <strong>Total Amount Paid:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                `
            });
            console.log(`[Invoice] Email successfully sent to ${targetEmail}`);
        } catch (emailErr) {
            console.warn(`[Invoice] Email dispatch failed (${emailErr.message}), order succeeded.`);
        }

        return res.status(200).json({
            success: true,
            message: "Order processed successfully! Confirmation and Invoice dispatched.",
            orderDetails
        });

    } catch (err) {
        console.error('Order processing exception:', err);
        return res.status(500).json({
            success: false,
            errorType: "MULE:SYSTEM_ERROR",
            message: err.message || "Internal server error during order execution."
        });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`✨ MuleSoft Order Management Cloud Service running!`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log(`📡 Ready for Render & Netlify Cloud Traffic`);
    console.log(`====================================================`);
});
