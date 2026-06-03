const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'BluemoonDB',
    options: {
        encrypt: false, // Dat false neu chay duoi local may ca nhan
        trustServerCertificate: true, // Bat buoc de true khi chay localhost
        enableArithAbort: true
    },
    port: parseInt(process.env.DB_PORT) || 1433 // Cong mac dinh cua SQL Server
};

const connectDB = async () => {
    try {
        const pool = await sql.connect(config);
        console.log('🎉 Ket noi SQL Server (SSMS) thanh cong voi database: ' + config.database);
        return pool;
    } catch (error) {
        console.error('❌ Loi ket noi SQL Server:', error.message);
        process.exit(1);
    }
};

module.exports = {
    sql,
    connectDB
};