const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// [TẠM THỜI] Hàm đăng ký để tạo tài khoản Manager hoặc test
const register = async (req, res) => {
    try {
        const { Username, Password, Role } = req.body;

        // 1. Kiểm tra xem tài khoản đã tồn tại chưa
        const request = new sql.Request();
        const checkUser = await request
            .input('Username', sql.VarChar, Username)
            .query('SELECT * FROM Accounts WHERE Username = @Username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        // 2. Băm mật khẩu (Hash password)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        // 3. Lưu vào Database
        await request
            .input('Password_Hash', sql.VarChar, hashedPassword)
            .input('Role', sql.VarChar, Role || 'Resident')
            .query(`
                INSERT INTO Accounts (Username, Password_Hash, Role) 
                VALUES (@Username, @Password_Hash, @Role)
            `);

        res.status(201).json({ message: 'Tạo tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Hàm đăng nhập
const login = async (req, res) => {
    try {
        const { Username, Password } = req.body;

        // 1. Tìm tài khoản trong DB
        const request = new sql.Request();
        const userResult = await request
            .input('Username', sql.VarChar, Username)
            .query('SELECT * FROM Accounts WHERE Username = @Username');

        const user = userResult.recordset[0];
        if (!user) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }

        // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã băm trong DB
        const isMatch = await bcrypt.compare(Password, user.Password_Hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }

        // 3. Tạo Token (Thẻ ra vào) chứa ID và Quyền của user
        const token = jwt.sign(
            { accountId: user.Account_ID, role: user.Role, householdId: user.Household_ID },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token hết hạn sau 1 ngày
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: { username: user.Username, role: user.Role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { register, login };
