const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

// Nạp trạm kiểm tra an ninh
const { verifyToken, isResident } = require('../middlewares/authMiddleware');

// Áp dụng bảo vệ cho tất cả các route của cư dân
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

module.exports = router;