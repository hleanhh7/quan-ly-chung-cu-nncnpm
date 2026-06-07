const { sql } = require('../config/db');

// API 1: Xem danh sách hóa đơn của nhà mình
const getMyInvoices = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        if (!householdId) return res.status(403).json({ message: 'Tài khoản chưa liên kết hộ khẩu!' });

        const request = new sql.Request();
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT * FROM Invoices WHERE Household_ID = @Household_ID ORDER BY Billing_Year DESC, Billing_Month DESC');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API 2: Gửi khai báo tạm trú / tạm vắng (Phiên bản dùng CCCD)
const createDeclaration = async (req, res) => {
    try {
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;
        // Nhận Identity_Card thay vì Resident_ID từ form
        const { Identity_Card, Declaration_Type, Start_Date, End_Date, Reason } = req.body;
        const request = new sql.Request();

        // 1. Hệ thống tự động đi tìm ID nội bộ dựa trên CCCD và mã Hộ khẩu của token
        const checkResident = await request
            .input('Identity_Card', sql.VarChar, Identity_Card)
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT Resident_ID FROM Residents WHERE Identity_Card = @Identity_Card AND Household_ID = @Household_ID');

        // 2. Chặn ngay nếu nhập bừa CCCD của người lạ không thuộc nhà mình
        if (checkResident.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người nào có số CCCD này trong danh sách nhân khẩu nhà bạn!' });
        }

        const residentId = checkResident.recordset[0].Resident_ID;

        // 3. Tiến hành lưu vào Database
        const insertReq = new sql.Request();
        await insertReq
            .input('Resident_ID', sql.Int, residentId)
            .input('Declaration_Type', sql.VarChar, Declaration_Type)
            .input('Start_Date', sql.Date, Start_Date)
            .input('End_Date', sql.Date, End_Date)
            .input('Reason', sql.NVarChar, Reason)
            .query(`
                INSERT INTO Declarations (Resident_ID, Declaration_Type, Start_Date, End_Date, Reason) 
                VALUES (@Resident_ID, @Declaration_Type, @Start_Date, @End_Date, @Reason)
            `);

        res.status(201).json({ message: 'Đã gửi khai báo thành công! Vui lòng chờ BQL duyệt.' });
    } catch (error) { 
        console.error("LỖI KHAI BÁO TẠM TRÚ:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};
// API: Lấy danh sách các dịch vụ hiện có
const getAvailableServices = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM Services');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Cư dân đăng ký dịch vụ
const registerService = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        const { Service_ID, Start_Date, Quantity } = req.body;
        const request = new sql.Request();

        await request
            .input('Household_ID', sql.Int, householdId)
            .input('Service_ID', sql.Int, Service_ID)
            .input('Start_Date', sql.Date, Start_Date)
            .input('Quantity', sql.Int, Quantity || 1)
            .query(`
                INSERT INTO ServiceRegistrations (Household_ID, Service_ID, Start_Date, Quantity) 
                VALUES (@Household_ID, @Service_ID, @Start_Date, @Quantity)
            `);

        res.status(201).json({ message: 'Gửi yêu cầu đăng ký dịch vụ thành công! Vui lòng chờ BQL duyệt.' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Xem các dịch vụ hộ mình đang đăng ký (THÊM CỘT STATUS VÀO ĐÂY)
const getMyRegisteredServices = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        const request = new sql.Request();
        
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query(`
                SELECT sr.Registration_ID, s.Service_Name, sr.Quantity, sr.Start_Date, s.Unit_Price, s.Calculation_Unit, sr.Status
                FROM ServiceRegistrations sr
                JOIN Services s ON sr.Service_ID = s.Service_ID
                WHERE sr.Household_ID = @Household_ID
                ORDER BY sr.Start_Date DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Lấy thông báo từ BQL
const getAnnouncements = async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request().query('SELECT * FROM Announcements ORDER BY Created_At DESC');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Thêm nhân khẩu (VÁ LỖI BẢO MẬT)
const addResident = async (req, res) => {
    try {
        // Bắt buộc lấy ID Hộ khẩu của chính người đang đăng nhập
        const householdId = req.user.householdId;
        const { Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner } = req.body;
        const request = new sql.Request();

        await request
            .input('Household_ID', sql.Int, householdId) // Chỉ được thêm vào hộ của mình
            .input('Full_Name', sql.NVarChar, Full_Name)
            .input('Identity_Card', sql.VarChar, Identity_Card)
            .input('Date_Of_Birth', sql.Date, Date_Of_Birth)
            .input('Phone_Number', sql.VarChar, Phone_Number)
            .input('Relation_With_Owner', sql.NVarChar, Relation_With_Owner)
            .query(`
                INSERT INTO Residents (Household_ID, Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner) 
                VALUES (@Household_ID, @Full_Name, @Identity_Card, @Date_Of_Birth, @Phone_Number, @Relation_With_Owner)
            `);

        res.status(201).json({ message: 'Khai báo nhân khẩu thành công!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// =========================================================================
// TÍNH NĂNG 5: ĐẶT LỊCH TIỆN ÍCH (BBQ, TENNIS, GYM)
// =========================================================================

// API: Gửi yêu cầu đặt lịch (Phiên bản nâng cấp chống lỗi)
const bookFacility = async (req, res) => {
    try {
        // Cố gắng lấy ID từ nhiều kiểu viết khác nhau của Token
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;

        if (!householdId) {
            console.log("❌ Lỗi Token: Không tìm thấy Household_ID", req.user);
            return res.status(400).json({ message: 'Lỗi xác thực: Không nhận diện được Hộ khẩu của bạn.' });
        }

        const { facility_name, booking_date, time_slot } = req.body;
        const request = new sql.Request();

        await request
            .input('Household_ID', sql.Int, householdId)
            .input('Facility_Name', sql.NVarChar, facility_name)
            .input('Booking_Date', sql.Date, booking_date)
            .input('Time_Slot', sql.NVarChar, time_slot)
            .query(`
                INSERT INTO FacilityBookings (Household_ID, Facility_Name, Booking_Date, Time_Slot) 
                VALUES (@Household_ID, @Facility_Name, @Booking_Date, @Time_Slot)
            `);

        res.status(201).json({ message: '🎉 Đặt lịch thành công! Vui lòng chờ BQL xác nhận.' });
    } catch (error) { 
        console.error("❌ LỖI ĐẶT LỊCH TẠI BACKEND:", error); // In lỗi đỏ ra Terminal
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};
// API: Lấy lịch sử đặt chỗ của nhà mình
const getMyBookings = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        const request = new sql.Request();
        
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT * FROM FacilityBookings WHERE Household_ID = @Household_ID ORDER BY Booking_Date DESC');
            
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};


// =========================================================================
// TÍNH NĂNG: GỬI PHẢN ÁNH / GÓP Ý
// =========================================================================

// API: Gửi phản ánh mới
const sendFeedback = async (req, res) => {
    try {
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;
        const { title, content } = req.body;
        
        // Dùng new sql.Request() cho đồng bộ với các hàm trên
        const request = new sql.Request();

        await request
            .input('Household_ID', sql.Int, householdId)
            .input('Title', sql.NVarChar, title)
            .input('Content', sql.NVarChar, content)
            .query(`
                INSERT INTO Feedbacks (Household_ID, Title, Content) 
                VALUES (@Household_ID, @Title, @Content)
            `);

        res.status(201).json({ message: 'Gửi phản ánh thành công! BQL sẽ sớm tiếp nhận.' });
    } catch (error) {
        console.error("LỖI GỬI PHẢN ÁNH:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Xem lịch sử phản ánh của nhà mình
const getMyFeedbacks = async (req, res) => {
    try {
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;
        const request = new sql.Request();
        
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query(`
                SELECT * FROM Feedbacks 
                WHERE Household_ID = @Household_ID 
                ORDER BY Created_At DESC
            `);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Cư dân tự thanh toán Online (Giả lập)
const payMyInvoice = async (req, res) => {
    try {
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;
        const { id } = req.params;
        const pool = await sql.connect();

        // Cập nhật trạng thái hóa đơn
        await pool.request()
            .input('Invoice_ID', sql.Int, id)
            .input('Household_ID', sql.Int, householdId)
            .query(`
                UPDATE Invoices 
                SET Payment_Status = N'Đã thanh toán', Payment_Date = GETDATE() 
                WHERE Invoice_ID = @Invoice_ID AND Household_ID = @Household_ID
            `);

        res.status(200).json({ message: 'Thanh toán Online thành công qua cổng thanh toán!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Xem danh sách thành viên trong gia đình
const getFamilyMembers = async (req, res) => {
    try {
        const householdId = req.user.householdId || req.user.Household_ID || req.user.id;
        const request = new sql.Request();
        
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT Full_Name, Identity_Card, Date_Of_Birth, Relation_With_Owner FROM Residents WHERE Household_ID = @Household_ID');
            
        res.status(200).json(result.recordset);
    } catch (error) { 
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};

module.exports = { 
    getMyInvoices, 
    createDeclaration, 
    getAvailableServices, 
    registerService, 
    getMyRegisteredServices,
    getAnnouncements,
    addResident,
    bookFacility,
    getMyBookings,
    sendFeedback,
    getMyFeedbacks,
    payMyInvoice,
    getFamilyMembers
};