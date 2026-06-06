const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

// Nạp trạm kiểm tra an ninh
const { verifyToken, isResident } = require('../middlewares/authMiddleware');

// Áp dụng bảo vệ cho tất cả các route của cư dân
// Bất cứ ai gọi API bắt đầu bằng /api/resident/... đều phải đi qua 2 trạm này
router.use(verifyToken, isResident);

// Đường dẫn: GET /api/resident/invoices
router.get('/invoices', residentController.getMyInvoices);

// Đường dẫn: POST /api/resident/declaration
router.post('/declaration', residentController.createDeclaration);

// Đường dẫn: GET /api/resident/services
router.get('/services', residentController.getAvailableServices);

// Đường dẫn: POST /api/resident/service-register
router.post('/service-register', residentController.registerService);

// Đường dẫn: GET /api/resident/my-services
router.get('/my-services', residentController.getMyRegisteredServices);

// Đường dẫn cho Đặt lịch tiện ích
router.post('/facility-bookings', residentController.bookFacility);
router.get('/facility-bookings', residentController.getMyBookings);

// ==========================================================
// TÍNH NĂNG MỚI (Thông báo & Phản ánh)
// ==========================================================
router.get('/announcements', residentController.getAnnouncements);
router.post('/feedbacks', residentController.sendFeedback);
// Thêm vào residentRoutes.js

// Thêm dòng này vào residentRoutes.js
router.post('/add-resident', residentController.addResident);

// Đường dẫn: Phản ánh / Góp ý
router.post('/feedbacks', residentController.sendFeedback);
router.get('/feedbacks', residentController.getMyFeedbacks);

router.put('/invoice/:id/pay', residentController.payMyInvoice);
// Đường dẫn: GET /api/resident/profile
router.get('/profile', residentController.getResidentProfile);
// Lấy danh sách nhân khẩu trong hộ
router.get('/residents', residentController.getMyResidents);

// LUÔN LUÔN ĐỂ DÒNG NÀY Ở CUỐI CÙNG
module.exports = router;