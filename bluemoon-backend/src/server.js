const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes'); // <-- THÊM DÒNG NÀY
const managerRoutes = require('./routes/managerRoutes'); // <-- THÊM DÒNG NÀY1
const residentRoutes = require('./routes/residentRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json()); // Cho phép server đọc dữ liệu định dạng JSON từ client gửi lên

app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes); // <-- THÊM DÒNG NÀY
app.use('/api/resident', residentRoutes);


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
        console.log(`💻 Server đang chạy tại đường dẫn: http://localhost:${PORT}`);
    });
};

startServer();