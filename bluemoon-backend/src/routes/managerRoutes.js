const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// Nap cac tram kiem tra an ninh (Middlewares)
const { verifyToken, isManager } = require('../middlewares/authMiddleware');

// Ap dung bao mat cho TAT CA cac duong dan trong router nay
router.use(verifyToken, isManager);

// CÁC ĐƯỜNG DẪN QUẢN LÝ CƠ BẢN
router.post('/household', managerController.createHousehold);
router.get('/households', managerController.getAllHouseholds);
router.put('/household/:id/status', managerController.updateHouseholdStatus);
router.post('/resident', managerController.addResident);
router.post('/account', managerController.createResidentAccount);
router.get('/household/:id/residents', managerController.getResidentsByHousehold);

// CÁC ĐƯỜNG DẪN DỊCH VỤ & HÓA ĐƠN
router.get('/registered-services', managerController.getAllRegisteredServices);
router.get('/service-requests', managerController.getPendingServiceRequests);
router.put('/service-request/:id', managerController.updateServiceRequestStatus);
router.post('/invoice', managerController.createInvoice);
router.get('/invoices', managerController.getAllInvoices);
router.put('/invoice/:id/pay', managerController.payInvoice);
// BỔ SUNG API MỚI: Quản lý tự cập nhật trạng thái hóa đơn (Check bằng cơm)
router.put('/invoice/:id/status', managerController.updateInvoiceStatus);

// ĐƯỜNG DẪN KHAI BÁO TẠM TRÚ / TẠM VẮNG
router.get('/declarations', managerController.getPendingDeclarations);
router.put('/declaration/:id', managerController.updateDeclarationStatus);

// TÍNH NĂNG ĐẶT LỊCH TIỆN ÍCH
router.get('/facility-bookings', managerController.getPendingFacilityBookings);
router.put('/facility-booking/:id', managerController.updateFacilityBookingStatus);

// TÍNH NĂNG THÔNG BÁO & PHẢN ÁNH
router.post('/announcements', managerController.createAnnouncement);
router.get('/feedbacks', managerController.getAllFeedbacks);
router.put('/feedback/:id', managerController.updateFeedbackStatus);

// QUẢN LÝ DANH MỤC PHÍ & DỊCH VỤ
router.get('/services', managerController.getAllServiceTypes);
router.post('/service', managerController.createServiceType);
router.put('/service/:id', managerController.updateServicePrice);
router.delete('/service/:id', managerController.deleteServiceType);


// LUON LUON DE DONG NAY O CUOI CUNG CUA FILE
module.exports = router;