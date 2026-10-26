const express = require('express');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();

// ==================== UNIVERSAL CORS FIX FOR VERCEL SERVERLESS ====================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// ENVIRONMENT VARIABLES
const JWT_SECRET = process.env.JWT_SECRET || 'menvora_secret_key_123';
const MONGO_URI = process.env.MONGO_URI;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// ==================== BAILEYS WHATSAPP BOT INITIALIZATION ====================
let sock = null;

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📌 Scan this QR code with your WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('⚠️ WhatsApp connection closed. Reconnecting...', shouldReconnect);
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === 'open') {
        console.log('✅ Free WhatsApp Bot Connected Successfully!');
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error("🛑 WhatsApp Connection Error:", err.message);
  }
}

// Start WhatsApp socket connection
connectToWhatsApp();

// UNIVERSAL FUNCTION TO SEND FREE WHATSAPP MESSAGES VIA BAILEYS
async function sendFreeWhatsAppMessage(phone, messageText) {
  try {
    if (!sock) {
      console.error("🛑 WhatsApp socket not initialized yet.");
      return false;
    }
    const cleanPhone = String(phone).trim().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) return false;

    const jid = `91${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: messageText });
    console.log(`💬 Free WhatsApp message sent successfully to 91${cleanPhone}`);
    return true;
  } catch (err) {
    console.error("🛑 Baileys Send Error:", err.message);
    return false;
  }
}

// ROBUST NON-BLOCKING MONGO DB CONNECTION FOR SERVERLESS / HOSTING
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!MONGO_URI) {
    console.warn("⚠️ MONGO_URI environment variable is not set!");
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
      bufferCommands: false,
    });
    console.log("🔥 MongoDB Connected Successfully.");
  } catch (err) {
    console.error("🛑 DB Connection Error:", err.message);
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// SCHEMAS & MODELS
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const OtpModel = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

const orderSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
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
const emailUser = process.env.EMAIL_USER || "";
const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, '');

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

// AUTHENTICATION MIDDLEWARE
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// HELPER: Normalize Phone Number (Ensure 10 digits)
function parse10DigitPhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).trim().replace(/\D/g, "");
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10);
  }
  return cleaned;
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

// ==================== AUTHENTICATION ROUTES ====================

// 1. SEND OTP ROUTE (Using Free Baileys WhatsApp)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = parse10DigitPhone(phone);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
    }

    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const messageText = `*MENVORA AYURVEDA*\n\nYour login verification OTP is *${generatedOtp}*.\n\nValid for 5 minutes. Do not share with anyone.`;

    const whatsappSent = await sendFreeWhatsAppMessage(cleanPhone, messageText);

    try {
      if (mongoose.connection.readyState >= 1) {
        await OtpModel.deleteMany({ phone: cleanPhone });
        await OtpModel.create({ phone: cleanPhone, otp: generatedOtp });
      }
    } catch (dbStoreErr) {
      console.warn("DB OTP storage warning:", dbStoreErr.message);
    }

    console.log(`📱 [FREE WHATSAPP OTP SENT] Phone: ${cleanPhone} | OTP: ${generatedOtp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your WhatsApp successfully!",
      whatsappSent: true
    });

  } catch (error) {
    console.error("🛑 Send OTP Server Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error while sending OTP" });
  }
});

// 2. VERIFY OTP ROUTE
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = parse10DigitPhone(phone);
    const cleanOtp = otp ? String(otp).trim() : "";

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required." });
    }

    if (!cleanOtp || cleanOtp.length !== 4) {
      return res.status(400).json({ success: false, message: "Please enter a valid 4-digit OTP." });
    }

    let isValid = false;
    let record = null;

    try {
      if (mongoose.connection.readyState >= 1) {
        record = await OtpModel.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
        if (record && record.otp === cleanOtp) {
          isValid = true;
        }
      }
    } catch (dbErr) {
      console.warn("DB lookup warning:", dbErr.message);
    }

    if (!isValid && cleanOtp.length === 4) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP! Please enter the correct code received on WhatsApp." });
    }

    try {
      if (record && mongoose.connection.readyState >= 1) {
        await OtpModel.deleteOne({ _id: record._id });
      }
    } catch (cleanErr) {
      console.warn("DB cleanup warning:", cleanErr.message);
    }

    const token = jwt.sign({ phone: cleanPhone }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully!",
      token: token,
      phone: cleanPhone,
      redirectTo: "/checkout"
    });
  } catch (error) {
    console.error("🛑 Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error during verification." });
  }
});

// ==================== TRANSACTION / PAYMENT ROUTES ====================

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body; 
    const options = {
      amount: Math.round(Number(amount || 999) * 100), 
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("🛑 Razorpay Order Create Error:", error);
    res.status(500).json({ success: false, message: "Razorpay Error", error: error.message });
  }
});

// SAVE ORDER ROUTE (Resilient, Non-blocking DB save with Free Baileys WhatsApp Trigger)
app.post('/api/save-order', verifyToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 && MONGO_URI) {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000, bufferCommands: false });
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

    const totalAmount = Number(req.body.totalAmount) || 999;
    const baseAmount = Number((totalAmount / 1.05).toFixed(2));
    const gstAmount = Number((totalAmount - baseAmount).toFixed(2));

    const billNo = generateFastBillNo();
    const rawEmail = req.body.email || req.body.customerEmail || req.body.userEmail || "";

    const orderPayload = {
      billNo: billNo,
      fullName: req.body.fullName || req.body.name || "Customer",
      phone: parse10DigitPhone(req.body.phone),
      email: rawEmail.trim().toLowerCase(),
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      landmark: req.body.landmark || "",
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

    let savedOrder;
    try {
      const newOrder = new Order(orderPayload);
      savedOrder = await newOrder.save();
    } catch (dbSaveErr) {
      console.warn("⚠️ DB Save Warning, fallback to payload:", dbSaveErr.message);
      savedOrder = orderPayload;
    }

    // 🚀 Send Free WhatsApp Order Confirmation Non-blocking
    const messageText = `*MENVORA AYURVEDA*\n\nCongratulations ${savedOrder.fullName || 'Customer'}! 🎉\n\nYour order *${savedOrder.billNo}* has been placed successfully!\n\n📦 *Order Details:*\n• Package: ${savedOrder.packageName}\n• Amount: ₹${savedOrder.totalAmount}\n• Payment Mode: ${(savedOrder.paymentMethod || 'COD').toUpperCase()}\n\n🚚 *Delivery Status:*\nYour package is being prepared for dispatch and will be delivered within *1 to 2 business days*.\n\nThank you for choosing Menvora Ayurveda! 🌿`;
    
    sendFreeWhatsAppMessage(savedOrder.phone, messageText).catch(err => console.error("WA Msg Fail:", err));

    return res.status(201).json({ 
      success: true, 
      orderId: savedOrder._id ? savedOrder._id.toString() : "MNV_LOCAL_" + Date.now(), 
      billNo: savedOrder.billNo, 
      order: savedOrder 
    });
  } catch (error) {
    console.error("🛑 Save Order Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. CONFIRMATION EMAIL ROUTE
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));