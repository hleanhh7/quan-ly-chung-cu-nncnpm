const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

// Nạp trạm kiểm tra an ninh
const { verifyToken, isResident } = require('../middlewares/authMiddleware');

// Áp dụng bảo vệ cho tất cả các route của cư dân
router.use(verifyToken, isResident);

// 1. Quản lý Hóa Đơn & Thanh toán
router.get('/invoices', residentController.getMyInvoices);
router.put('/invoice/:id/pay', residentController.payMyInvoice);

// 2. Quản lý Dịch vụ
router.get('/services', residentController.getAvailableServices);
router.post('/service-register', residentController.registerService);
router.get('/my-services', residentController.getMyRegisteredServices);

// 3. Quản lý Đặt lịch tiện ích
router.post('/facility-bookings', residentController.bookFacility);
router.get('/facility-bookings', residentController.getMyBookings);

// 4. Quản lý Thông báo & Phản ánh
router.get('/announcements', residentController.getAnnouncements);
router.post('/feedbacks', residentController.sendFeedback);
router.get('/feedbacks', residentController.getMyFeedbacks);

// 5. Quản lý Nhân khẩu & Hành chính
router.post('/add-resident', residentController.addResident); // Tên đường dẫn chuẩn là add-resident
router.post('/declaration', residentController.createDeclaration);
router.get('/family-members', residentController.getFamilyMembers);

// LUÔN LUÔN ĐỂ DÒNG NÀY Ở CUỐI CÙNG
module.exports = router;