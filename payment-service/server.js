require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Giúp đọc được JSON từ Body request

// Kết nối Database
connectDB();

// Gọi các Routes
app.use('/api/payments', paymentRoutes);

// Bật Server
const PORT = process.env.PORT || 8003; // Sửa về 8003
app.listen(PORT, () => {
  console.log(`🚀 Payment Service đang chạy tại cổng ${PORT}`);
});