const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// Nap cac tram kiem tra an ninh (Middlewares)
const { verifyToken, isManager } = require('../middlewares/authMiddleware');

// Ap dung bao mat cho TAT CA cac duong dan trong router nay
// Bat cu ai goi API bat dau bang /api/manager/... deu phai di qua 2 tram nay
router.use(verifyToken, isManager);

// Duong dan: POST /api/manager/household
router.post('/household', managerController.createHousehold);

// Duong dan: POST /api/manager/resident
router.post('/resident', managerController.addResident);

// Duong dan: POST /api/manager/invoice
router.post('/invoice', managerController.createInvoice);

// Duong dan: GET /api/manager/households
router.get('/households', managerController.getAllHouseholds);

// Duong dan: POST /api/manager/account
router.post('/account', managerController.createResidentAccount);

// Duong dan: GET /api/manager/declarations (Lay danh sach cho duyet)
router.get('/declarations', managerController.getPendingDeclarations);

// Duong dan: PUT /api/manager/declaration/:id (Cap nhat trang thai duyet)
router.put('/declaration/:id', managerController.updateDeclarationStatus);

// Duong dan: PUT /api/manager/household/:id/status
router.put('/household/:id/status', managerController.updateHouseholdStatus);

// Duong dan: GET /api/manager/invoices (Lay danh sach tat ca hoa don)
router.get('/invoices', managerController.getAllInvoices);

// Duong dan: PUT /api/manager/invoice/:id/pay (Xac nhan thu tien)
router.put('/invoice/:id/pay', managerController.payInvoice);

// Duong dan: GET /api/manager/registered-services
router.get('/registered-services', managerController.getAllRegisteredServices);

// ==========================================================
// TINH NANG MOI (Thong bao & Phan anh)
// ==========================================================
router.post('/announcements', managerController.createAnnouncement);
router.get('/feedbacks', managerController.getAllFeedbacks);
router.put('/feedbacks/:id', managerController.updateFeedbackStatus);

// LUON LUON DE DONG NAY O CUOI CUNG CUA FILE
module.exports = router;