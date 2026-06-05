const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const managerRoutes = require('./routes/managerRoutes');
const residentRoutes = require('./routes/residentRoutes');
const serviceRoutes = require('./routes/serviceRoutes'); // <-- 1. KHAI BÁO FILE ROUTE DỊCH VỤ Ở ĐÂY


const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json()); // Cho phép server đọc dữ liệu định dạng JSON từ client gửi lên

app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/resident', residentRoutes);
app.use('/api/services', serviceRoutes); // <-- 2. KÍCH HOẠT ĐƯỜNG DẪN API DỊCH VỤ Ở ĐÂY


// Route kiểm tra server hoạt động
app.get('/', (req, res) => {
    res.send('Bluemoon API Server đang hoạt động tốt! 🚀');
});

// Hàm khởi chạy ứng dụng
const startServer = async () => {
    // 1. Kiểm tra kết nối Database trước
    await connectDB();

    // 2. Mở cổng chạy Server Backend
    app.listen(PORT, () => {
        console.log(`💻 Server BẢN MỚI NHẤT đang chạy tại: http://localhost:${PORT}`);
    });
};

startServer();