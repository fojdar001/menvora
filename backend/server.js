const express = require('express');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

let makeWASocket = null;
let useMultiFileAuthState = null;
let DisconnectReason = null;
let fetchLatestBaileysVersion = null;
let pino = null;

if (!process.env.VERCEL) {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  pino = require('pino');
}

const app = express();

// ==================== UNIVERSAL CORS FIX ====================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// ENVIRONMENT VARIABLES CONFIGURATION
const JWT_SECRET = process.env.JWT_SECRET || 'menvora_secret_key_123';
const MONGO_URI = process.env.MONGO_URI;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_live_TsUqPWXB1ZVKKJ";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "JdMrJsY9yH6vgVijtMwbZ2iI";

// WHATSAPP BUSINESS NUMBER (91 + 9211881387)
const WHATSAPP_BOT_NUMBER = (process.env.WHATSAPP_BOT_NUMBER || "919211881387").replace(/\D/g, "");

// ==================== WHATSAPP BOT (NON-VERCEL PERSISTENT SERVERS ONLY) ====================
let sock = null;
let latestPairingCode = null;
let isWhatsAppConnected = false;

async function connectToWhatsApp() {
  if (process.env.VERCEL || !makeWASocket) {
    return;
  }
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(WHATSAPP_BOT_NUMBER);
          latestPairingCode = code;
          console.log(`\n========================================`);
          console.log(`📲 WHATSAPP PAIRING CODE FOR +${WHATSAPP_BOT_NUMBER}: ${code}`);
          console.log(`👉 WhatsApp Business -> Linked Devices -> Link a Device -> Link with phone number instead -> Enter: ${code}`);
          console.log(`========================================\n`);
        } catch (pairErr) {
          console.error("🛑 Pairing Code Request Error:", pairErr.message);
        }
      }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        isWhatsAppConnected = false;
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('⚠️ WhatsApp connection closed. Reconnecting...', shouldReconnect);
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === 'open') {
        isWhatsAppConnected = true;
        latestPairingCode = null;
        console.log(`✅ WhatsApp Business (+${WHATSAPP_BOT_NUMBER}) Connected Successfully!`);
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error("🛑 WhatsApp Connection Error:", err.message);
  }
}

if (!process.env.VERCEL) {
  connectToWhatsApp();
}

app.get('/pair', (req, res) => {
  if (process.env.VERCEL) {
    return res.status(200).send(`
      <div style="text-align:center; margin-top:60px; font-family:Arial;">
        <h2>WhatsApp Pairing is disabled on Vercel Serverless</h2>
        <p>Order saving and PDF confirmation emails work directly here. Run locally or on a persistent server for WhatsApp bot pairing.</p>
      </div>
    `);
  }

  if (isWhatsAppConnected) {
    return res.send(`
      <div style="text-align:center; margin-top:60px; font-family:Arial;">
        <h2 style="color:#0F8A43;">✅ WhatsApp Business (+${WHATSAPP_BOT_NUMBER}) is Connected!</h2>
        <p>Order confirmation messages will be sent automatically after checkout.</p>
      </div>
    `);
  }

  if (!latestPairingCode) {
    return res.send(`
      <div style="text-align:center; margin-top:60px; font-family:Arial;">
        <h2>⏳ Generating Pairing Code for +${WHATSAPP_BOT_NUMBER}...</h2>
        <p>Page will refresh automatically in 4 seconds.</p>
        <script>setTimeout(() => location.reload(), 4000);</script>
      </div>
    `);
  }

  res.send(`
    <div style="text-align:center; margin-top:60px; font-family:Arial;">
      <h2>📲 Link WhatsApp Business (+${WHATSAPP_BOT_NUMBER})</h2>
      <p>1. Open <b>WhatsApp Business</b> on your phone</p>
      <p>2. Go to <b>Linked Devices -> Link a Device -> Link with phone number instead</b></p>
      <p>3. Enter this 8-character pairing code:</p>
      <div style="display:inline-block; margin-top:15px; padding:18px 32px; font-size:32px; font-weight:bold; letter-spacing:6px; background:#f0fdf4; border:2px solid #0F8A43; border-radius:12px; color:#0F8A43;">
        ${latestPairingCode}
      </div>
    </div>
  `);
});

// HELPER: Normalize Phone Number (Ensure 10 digits)
function parse10DigitPhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).trim().replace(/\D/g, "");
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10);
  }
  return cleaned;
}

async function sendOrderWhatsAppMessage(phone, messageText) {
  try {
    if (process.env.VERCEL || !sock || !isWhatsAppConnected) {
      return false;
    }
    const cleanPhone = parse10DigitPhone(phone);
    if (cleanPhone.length !== 10) return false;

    const jid = `91${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: messageText });
    console.log(`💬 WhatsApp order confirmation sent to 91${cleanPhone}`);
    return true;
  } catch (err) {
    console.error("🛑 WhatsApp Send Error:", err.message);
    return false;
  }
}

// ROBUST NON-BLOCKING MONGO DB CONNECTION
let cachedDbPromise = null;
let lastDbError = "";

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    lastDbError = "";
    return true;
  }
  if (!MONGO_URI) {
    lastDbError = "MONGO_URI environment variable is missing.";
    console.warn("⚠️", lastDbError);
    return false;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 15000,
        bufferCommands: false,
      })
      .then(() => {
        lastDbError = "";
        console.log("🔥 MongoDB Connected Successfully.");
        return true;
      })
      .catch((err) => {
        cachedDbPromise = null;
        lastDbError = err.message;
        console.error("🛑 DB Connection Error:", err.message);
        return false;
      });
  }
  return cachedDbPromise;
}

// SCHEMAS & MODELS
const orderSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String, default: "" },
  packageName: { type: String, default: "Menvora Product" },
  quantity: { type: Number, default: 1 },
  baseAmount: { type: Number, default: 951.43 },
  gstAmount: { type: Number, default: 47.57 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: 'Pending' },
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// RAZORPAY INSTANCE
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// NODEMAILER TRANSPORTER FOR PRIMARY INBOX DELIVERY
const emailUser = process.env.EMAIL_USER || "menvoraayurveda@gmail.com";
const emailPass = (process.env.EMAIL_PASS || "mvskzvezflsqtprp").replace(/\s+/g, '');

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// OPTIONAL TOKEN PARSER (Direct checkout ke liye token optional hai)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignore invalid/expired token for direct guest checkout
    }
  }
  next();
}

// PDF TAX INVOICE GENERATOR
function generateTaxInvoicePDF(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const isHaryana = (orderData.state || "").toLowerCase().includes("haryana");
      const total = Number(orderData.totalAmount || orderData.total) || 999;
      const basePrice = Number(orderData.baseAmount) || Number((total / 1.05).toFixed(2));
      const gstAmt = Number(orderData.gstAmount) || Number((total - basePrice).toFixed(2));
      const cgst = isHaryana ? (gstAmt / 2) : 0;
      const sgst = isHaryana ? (gstAmt / 2) : 0;
      const igst = !isHaryana ? gstAmt : 0;

      doc.fontSize(20).fillColor('#1b5e20').text('MENVORA AYURVEDA', { align: 'center' });
      doc.fontSize(10).fillColor('#333333').text('OFFICIAL TAX INVOICE / RECEIPT', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(9).fillColor('#444444');
      doc.text('Seller: Menvora Ayurveda');
      doc.text('GSTIN: 06SMOPS3257K1ZY');
      doc.text('State: Haryana (06)');
      doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown(0.5);

      doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      const currentY = doc.y;
      doc.fontSize(10).fillColor('#000000').text(`Invoice No: ${orderData.billNo}`, 40, currentY);
      doc.text(`Order Ref ID: ${orderData.orderId || 'MNV-REF-ORDER'}`, 40, currentY + 14);
      doc.text(`Payment Mode: ${(orderData.paymentMethod || orderData.method || 'COD').toUpperCase()}`, 40, currentY + 28);

      doc.text(`Customer Name: ${orderData.fullName || orderData.name || 'Valued Customer'}`, 300, currentY);
      doc.text(`Phone: ${orderData.phone || 'N/A'}`, 300, currentY + 14);
      doc.text(`Address: ${orderData.address || ''}`, 300, currentY + 28, { width: 250 });
      doc.text(`${orderData.city || ''}, ${orderData.state || ''} ${orderData.pincode || ''}`, 300, doc.y);

      doc.moveDown(1.5);

      const tableTop = doc.y + 10;
      doc.fontSize(9).fillColor('#1b5e20');
      doc.text('Item Description', 40, tableTop);
      doc.text('HSN', 210, tableTop);
      doc.text('Qty', 260, tableTop);
      doc.text('Base Price', 310, tableTop);
      doc.text('GST (5%)', 400, tableTop);
      doc.text('Total (INR)', 480, tableTop);

      doc.strokeColor('#1b5e20').lineWidth(1.5).moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      const itemTop = tableTop + 25;
      doc.fontSize(9).fillColor('#333333');
      doc.text(orderData.packageName || orderData.product || 'Menvora Product', 40, itemTop, { width: 160 });
      doc.text('3004', 210, itemTop);
      doc.text(`${orderData.quantity || 1}`, 260, itemTop);
      doc.text(`Rs. ${basePrice.toFixed(2)}`, 310, itemTop);
      doc.text(`Rs. ${gstAmt.toFixed(2)}`, 400, itemTop);
      doc.text(`Rs. ${total.toFixed(2)}`, 480, itemTop);

      doc.moveDown(4);

      doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      doc.fontSize(9).fillColor('#444444');
      doc.text(`Taxable Base Amount: Rs. ${basePrice.toFixed(2)}`, { align: 'right' });
      if (isHaryana) {
        doc.text(`CGST (2.5%): Rs. ${cgst.toFixed(2)}`, { align: 'right' });
        doc.text(`SGST (2.5%): Rs. ${sgst.toFixed(2)}`, { align: 'right' });
      } else {
        doc.text(`IGST (5.0%): Rs. ${igst.toFixed(2)}`, { align: 'right' });
      }
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#000000').text(`Grand Total: Rs. ${total.toFixed(2)}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#888888').text('This is an electronically generated tax invoice from Menvora Ayurveda.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// FAST NON-BLOCKING BILL NUMBER GENERATOR
function generateFastBillNo() {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `INV-${currentYear}-${randomSuffix}`;
}

// ==================== HEALTH CHECK ROUTE ====================
app.get('/', async (req, res) => {
  const dbConnected = await connectDB();
  res.status(200).json({
    success: true,
    message: "Menvora Ayurveda Backend is Live!",
    dbConnected,
    dbError: lastDbError || undefined,
    whatsappConnected: isWhatsAppConnected
  });
});

// ==================== TRANSACTION / PAYMENT ROUTES ====================

app.post('/api/create-order', async (req, res) => {
  try {
    const rawAmount = Number(req.body?.amount);
    const validAmount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 999;

    const options = {
      amount: Math.round(validAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    };
    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    const razorpayDetail =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      "Unknown Razorpay Error";
    console.error("🛑 Razorpay Order Create Error:", razorpayDetail, error);
    return res.status(500).json({
      success: false,
      message: "Razorpay Error",
      error: razorpayDetail
    });
  }
});

// SAVE ORDER ROUTE (Direct Checkout)
app.post('/api/save-order', optionalAuth, async (req, res) => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: `Database connection failed: ${lastDbError || "Unable to connect to MongoDB"}`
      });
    }

    const paymentMethod = req.body.paymentMethod || "COD";
    let paymentStatus = 'Pending';

    if (paymentMethod !== 'COD' && paymentMethod !== 'cod') {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ success: false, error: "Missing Razorpay payment proof." });
      }

      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, error: "Payment verification failed! Invalid signature." });
      }

      paymentStatus = 'Paid';
    }

    const cleanPhone = parse10DigitPhone(req.body.phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: "Valid 10-digit mobile number is required." });
    }

    const totalAmount = Number(req.body.totalAmount) || 999;
    const baseAmount = Number((totalAmount / 1.05).toFixed(2));
    const gstAmount = Number((totalAmount - baseAmount).toFixed(2));

    const billNo = generateFastBillNo();
    const rawEmail = req.body.email || req.body.customerEmail || req.body.userEmail || "";

    const orderPayload = {
      billNo: billNo,
      fullName: (req.body.fullName || req.body.name || "Customer").trim(),
      phone: cleanPhone,
      email: rawEmail.trim().toLowerCase(),
      address: (req.body.address || "Not Provided").trim(),
      city: (req.body.city || "Not Provided").trim(),
      state: (req.body.state || "Not Provided").trim(),
      pincode: (req.body.pincode || "000000").trim(),
      landmark: (req.body.landmark || "").trim(),
      packageName: req.body.packageName || req.body.product || "Menvora Ayurvedic Product",
      quantity: Number(req.body.quantity) || 1,
      baseAmount,
      gstAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId: req.body.razorpayOrderId || "",
      razorpayPaymentId: req.body.razorpayPaymentId || ""
    };

    const newOrder = new Order(orderPayload);
    const savedOrder = await newOrder.save();

    if (!process.env.VERCEL && isWhatsAppConnected) {
      const waMessage = `*MENVORA AYURVEDA*\n\nNamaste ${savedOrder.fullName} 🙏\nAapka order confirm ho gaya hai!\n\n🧾 *Invoice No:* ${savedOrder.billNo}\n📦 *Package:* ${savedOrder.packageName} (Qty: ${savedOrder.quantity})\n💰 *Total Amount:* ₹${savedOrder.totalAmount}\n💳 *Payment Mode:* ${(savedOrder.paymentMethod || 'COD').toUpperCase()}\n🚚 *Delivery:* 1-2 working days\n\nThank you for choosing Menvora Ayurveda! 🌿`;
      sendOrderWhatsAppMessage(savedOrder.phone, waMessage).catch((err) => {
        console.warn("WhatsApp confirmation error:", err.message);
      });
    }

    return res.status(201).json({
      success: true,
      orderId: savedOrder._id.toString(),
      billNo: savedOrder.billNo,
      order: savedOrder
    });
  } catch (error) {
    console.error("🛑 Save Order Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CONFIRMATION EMAIL ROUTE
app.post('/api/send-confirmation-email', async (req, res) => {
  try {
    const orderData = req.body;
    const recipientEmail = (orderData.email || orderData.customerEmail || orderData.userEmail || "").trim();

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: "Recipient email is required." });
    }

    if (!emailUser || !emailPass) {
      console.warn("⚠️ EMAIL_USER or EMAIL_PASS not configured.");
      return res.status(400).json({ success: false, message: "Email credentials not configured on server." });
    }

    let pdfBuffer;
    try {
      pdfBuffer = await generateTaxInvoicePDF(orderData);
    } catch (pdfErr) {
      console.error("🛑 PDF Generation Error:", pdfErr.message);
      pdfBuffer = Buffer.from("Invoice PDF generation failed, but order is confirmed.");
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #0F8A43; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">MENVORA AYURVEDA</h1>
                    <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 14px;">Order Confirmation & Invoice Receipt</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; color: #27272a;">
                    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${orderData.fullName || 'Valued Customer'}</strong>,</p>
                    <p style="font-size: 14px; color: #52525b; line-height: 1.5;">Congratulations! Your order has been placed successfully and is being processed. Expected delivery is within <strong>1 to 2 business days</strong>.</p>
                    
                    <table role="presentation" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 18px; margin: 20px 0;">
                      <tr>
                        <td style="font-size: 14px; color: #3f3f46; line-height: 1.8;">
                          <strong>Invoice No:</strong> ${orderData.billNo || 'N/A'}<br/>
                          <strong>Product:</strong> ${orderData.packageName || 'Ayurvedic Wellness Package'}<br/>
                          <strong>Total Amount Paid:</strong> ₹${orderData.totalAmount || '999'}<br/>
                          <strong>Payment Mode:</strong> ${(orderData.paymentMethod || 'COD').toUpperCase()}<br/>
                          <strong>Delivery Estimate:</strong> 1-2 Working Days<br/>
                          <strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: bold;">${orderData.paymentStatus || 'Successful'}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 14px; color: #52525b; line-height: 1.5;">Your official tax invoice PDF has been attached with this email for your reference.</p>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f4f4f5; text-align: center;">
                      <p style="font-size: 13px; color: #71717a; margin: 0;">If you have any questions, feel free to reply directly to this email.</p>
                      <p style="font-size: 14px; color: #0F8A43; font-weight: bold; margin-top: 8px;">Warm Regards,<br/>Menvora Ayurveda Support</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Menvora Ayurveda" <${emailUser}>`,
      to: recipientEmail,
      replyTo: emailUser,
      subject: `Order Confirmed: Invoice ${orderData.billNo || 'MNV-ORDER'}`,
      text: `Dear ${orderData.fullName || 'Customer'},\n\nCongratulations! Your order with Menvora Ayurveda is confirmed. Bill No: ${orderData.billNo}. Your order will arrive in 1-2 working days. Attached is your tax invoice.`,
      html: htmlBody,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'Nodemailer'
      },
      attachments: [
        {
          filename: `Invoice_${orderData.billNo || 'Order'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log("📧 Primary Email Sent Successfully:", info.messageId);

    return res.status(200).json({ success: true, message: "Email Sent Successfully", messageId: info.messageId });
  } catch (err) {
    console.error("🛑 Email Dispatch Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;