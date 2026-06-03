const jwt = require('jsonwebtoken');

// Kiểm tra xem người dùng đã đăng nhập (có token) chưa
const verifyToken = (req, res, next) => {
    // Client thường gửi token trong Header với định dạng: "Bearer <token_string>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Truy cập bị từ chối. Không tìm thấy Token!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin giải mã được (ID, Role) vào request để các API sau dùng lại
        next(); // Cho phép đi tiếp
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// Kiểm tra xem người dùng có phải là Quản lý không
const isManager = (req, res, next) => {
    if (req.user && req.user.role === 'Manager') {
        next(); // Là quản lý thì cho đi tiếp
    } else {
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    }
};

const isResident = (req, res, next) => {
    if (req.user && req.user.role === 'Resident') {
        next(); // Là Cư dân thì cho đi tiếp
    } else {
        return res.status(403).json({ message: 'Chỉ Cư dân mới có thể sử dụng tính năng này!' });
    }
};

module.exports = { verifyToken, isManager, isResident };