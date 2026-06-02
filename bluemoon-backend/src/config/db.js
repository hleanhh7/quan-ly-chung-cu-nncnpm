const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Bắt buộc nếu dùng Azure, hoặc chạy cục bộ bảo mật
        trustServerCertificate: true // Bỏ qua chứng chỉ SSL tự ký (rất quan trọng khi chạy localhost)
    }
};

// Hàm kết nối và trả về connection pool
const connectDB = async () => {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('🎉 Kết nối SQL Server thành công với database:', process.env.DB_NAME);
        return pool;
    } catch (error) {
        console.error('❌ Lỗi kết nối SQL Server:', error.message);
        process.exit(1); // Dừng ứng dụng nếu không kết nối được DB
    }
};

module.exports = {
    sql,
    connectDB
};