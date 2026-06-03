const { sql } = require('../config/db');

// ==========================================
// API DÀNH CHO CẢ CƯ DÂN & BAN QUẢN LÝ
// ==========================================

// 1. Xem danh sách toàn bộ các dịch vụ hệ thống đang cung cấp
const getAllServices = async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Services');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ', error: error.message });
    }
};

// ==========================================
// API DÀNH CHO CƯ DÂN (RESIDENT)
// ==========================================

// 2. Cư dân đăng ký sử dụng một dịch vụ mới
const registerService = async (req, res) => {
    try {
        const { household_id, service_id, start_date, quantity } = req.body;

        if (!household_id || !service_id || !start_date || !quantity) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin đăng ký!' });
        }

        const insertRequest = new sql.Request();
        insertRequest.input('household_id', sql.Int, household_id);
        insertRequest.input('service_id', sql.Int, service_id);
        insertRequest.input('start_date', sql.Date, start_date);
        insertRequest.input('quantity', sql.Int, quantity);

        await insertRequest.query(`
            INSERT INTO ServiceRegistrations (Household_ID, Service_ID, Start_Date, End_Date, Quantity)
            VALUES (@household_id, @service_id, @start_date, NULL, @quantity)
        `);

        res.status(201).json({ message: 'Đăng ký dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký dịch vụ', error: error.message });
    }
};


// 3. Cư dân xem các dịch vụ nhà mình đang sử dụng
const getMyServices = async (req, res) => {
    try {
        const { household_id } = req.params;
        const request = new sql.Request();
        request.input('household_id', sql.Int, household_id);

        const result = await request.query(`
            SELECT sr.Registration_ID, sr.Start_Date, sr.End_Date, sr.Quantity, 
                   s.Service_Name, s.Unit_Price, s.Calculation_Unit
            FROM ServiceRegistrations sr
            JOIN Services s ON sr.Service_ID = s.Service_ID
            WHERE sr.Household_ID = @household_id
            ORDER BY sr.Start_Date DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ', error: error.message });
    }
};
// ==========================================
// API DÀNH CHO BAN QUẢN LÝ (MANAGER)
// ==========================================

// 4. Ban quản lý xem danh sách tất cả các hộ đang dùng dịch vụ
const getAllRegistrations = async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT sr.Registration_ID, sr.Registration_Date, sr.Status, 
                   s.Service_Name, s.Price, 
                   h.Room_Number, h.Owner_Name
            FROM ServiceRegistrations sr
            JOIN Services s ON sr.Service_ID = s.Service_ID
            JOIN Households h ON sr.Household_ID = h.Household_ID
            ORDER BY h.Room_Number ASC, sr.Registration_Date DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu quản lý dịch vụ', error: error.message });
    }
};

// 5. Ban quản lý hủy dịch vụ của một hộ (khi họ báo cắt)
const cancelService = async (req, res) => {
    try {
        const { registration_id } = req.params;
        
        const request = new sql.Request();
        request.input('registration_id', sql.Int, registration_id);

        await request.query(`
            UPDATE ServiceRegistrations 
            SET Status = N'Đã hủy' 
            WHERE Registration_ID = @registration_id
        `);

        res.json({ message: 'Đã hủy dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi hủy dịch vụ', error: error.message });
    }
};

// ========================================================
// NHÓM 2: QUẢN LÝ ĐẶT LỊCH TIỆN ÍCH (FacilityBookings)
// ========================================================

const bookFacility = async (req, res) => {
    try {
        const householdId = req.user.householdId; 
        const { facility_name, booking_date, time_slot } = req.body;

        if (!facility_name || !booking_date || !time_slot) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ ngày và khung giờ đặt!' });
        }

        // Kiểm tra xem khung giờ này, ngày này, tại tiện ích này đã có ai đặt chưa
        const checkReq = new sql.Request();
        const checkConflict = await checkReq
            .input('Facility_Name', sql.NVarChar, facility_name)
            .input('Booking_Date', sql.Date, booking_date)
            .input('Time_Slot', sql.VarChar, time_slot)
            .query(`
                SELECT * FROM FacilityBookings 
                WHERE Facility_Name = @Facility_Name 
                AND Booking_Date = @Booking_Date
                AND Time_Slot = @Time_Slot
                AND Status IN (N'Chờ xác nhận', N'Đã xác nhận')
            `);

        if (checkConflict.recordset.length > 0) {
            return res.status(400).json({ message: 'Khung giờ này đã có người đặt, vui lòng chọn giờ khác!' });
        }

        const insertReq = new sql.Request();
        await insertReq
            .input('Household_ID', sql.Int, householdId)
            .input('Facility_Name', sql.NVarChar, facility_name)
            .input('Booking_Date', sql.Date, booking_date)
            .input('Time_Slot', sql.VarChar, time_slot)
            .query(`
                INSERT INTO FacilityBookings (Household_ID, Facility_Name, Booking_Date, Time_Slot)
                VALUES (@Household_ID, @Facility_Name, @Booking_Date, @Time_Slot)
            `);

        res.status(201).json({ message: 'Đặt lịch thành công, đang chờ BQL xác nhận!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getFacilityBookings = async (req, res) => {
    try {
        const role = req.user.role;
        const householdId = req.user.householdId;
        const request = new sql.Request();

        let query = `
            SELECT b.*, h.Room_Number 
            FROM FacilityBookings b
            JOIN Households h ON b.Household_ID = h.Household_ID
        `;

        if (role === 'Resident') {
            query += ` WHERE b.Household_ID = @Household_ID`;
            request.input('Household_ID', sql.Int, householdId);
        }

        query += ` ORDER BY b.Booking_Date DESC`;

        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const updateFacilityBookingStatus = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { status } = req.body; 

        const request = new sql.Request();
        await request
            .input('Booking_ID', sql.Int, booking_id)
            .input('Status', sql.NVarChar, status)
            .query(`UPDATE FacilityBookings SET Status = @Status WHERE Booking_ID = @Booking_ID`);

        res.status(200).json({ message: `Đã cập nhật trạng thái thành: ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Nhớ xuất (export) 3 hàm này nhé
// module.exports = { ..., bookFacility, getFacilityBookings, updateFacilityBookingStatus };

module.exports = {
    getAllServices,
    registerService,
    getMyServices,
    getAllRegistrations,
    cancelService,
    bookFacility,
    getFacilityBookings,
    updateFacilityBookingStatus
};