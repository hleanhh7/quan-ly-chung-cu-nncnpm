const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Ai cũng xem được danh sách dịch vụ để chọn
router.get('/list', serviceController.getAllServices);

// API của Resident
router.post('/register', serviceController.registerService);
router.get('/my-services/:household_id', serviceController.getMyServices);

// API của Manager
router.get('/manager/all-registrations', serviceController.getAllRegistrations);
router.put('/manager/cancel/:registration_id', serviceController.cancelService);

module.exports = router;