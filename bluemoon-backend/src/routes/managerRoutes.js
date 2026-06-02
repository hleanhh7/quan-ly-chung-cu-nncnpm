const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// Nạp các trạm kiểm tra an ninh (Middlewares)
const { verifyToken, isManager } = require('../middlewares/authMiddleware');

// Áp dụng bảo mật cho TẤT CẢ các đường dẫn trong router này
// Bất cứ ai gọi API bắt đầu bằng /api/manager/... đều phải đi qua 2 trạm này
router.use(verifyToken, isManager);

// Đường dẫn: POST /api/manager/household
router.post('/household', managerController.createHousehold);

// Đường dẫn: POST /api/manager/resident
router.post('/resident', managerController.addResident);

module.exports = router;

// Đường dẫn: POST /api/manager/invoice
router.post('/invoice', managerController.createInvoice);

// Đường dẫn: GET /api/manager/households
router.get('/households', managerController.getAllHouseholds);

// Đường dẫn: POST /api/manager/account
router.post('/account', managerController.createResidentAccount);

// Đường dẫn: GET /api/manager/declarations (Lấy danh sách chờ duyệt)
router.get('/declarations', managerController.getPendingDeclarations);

// Đường dẫn: PUT /api/manager/declaration/:id (Cập nhật trạng thái duyệt)
router.put('/declaration/:id', managerController.updateDeclarationStatus);

// Đường dẫn: PUT /api/manager/household/:id/status
router.put('/household/:id/status', managerController.updateHouseholdStatus);

// Đường dẫn: GET /api/manager/invoices (Lấy danh sách tất cả hóa đơn)
router.get('/invoices', managerController.getAllInvoices);

// Đường dẫn: PUT /api/manager/invoice/:id/pay (Xác nhận thu tiền)
router.put('/invoice/:id/pay', managerController.payInvoice);

// Đường dẫn: GET /api/manager/registered-services
router.get('/registered-services', managerController.getAllRegisteredServices);