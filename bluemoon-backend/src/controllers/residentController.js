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

// API 2: Gửi khai báo tạm trú / tạm vắng
const createDeclaration = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        const { Resident_ID, Declaration_Type, Start_Date, End_Date, Reason } = req.body;
        const request = new sql.Request();

        const checkResident = await request
            .input('Resident_ID', sql.Int, Resident_ID)
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT * FROM Residents WHERE Resident_ID = @Resident_ID AND Household_ID = @Household_ID');

        if (checkResident.recordset.length === 0) {
            return res.status(403).json({ message: 'Nhân khẩu không tồn tại hoặc không thuộc hộ của bạn!' });
        }

        await request
            .input('Declaration_Type', sql.VarChar, Declaration_Type)
            .input('Start_Date', sql.Date, Start_Date)
            .input('End_Date', sql.Date, End_Date)
            .input('Reason', sql.NVarChar, Reason)
            .query(`
                INSERT INTO Declarations (Resident_ID, Declaration_Type, Start_Date, End_Date, Reason) 
                VALUES (@Resident_ID, @Declaration_Type, @Start_Date, @End_Date, @Reason)
            `);

        res.status(201).json({ message: 'Đã gửi khai báo thành công, đang chờ Quản lý duyệt!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
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

// API: Gửi phản ánh
const sendFeedback = async (req, res) => {
    try {
        const householdId = req.user.householdId; 
        const { Title, Content } = req.body;
        if (!householdId) return res.status(403).json({ message: 'Tài khoản chưa liên kết căn hộ!' });
        
        const pool = await sql.connect();
        await pool.request()
            .input('Household_ID', sql.Int, householdId)
            .input('Title', sql.NVarChar, Title)
            .input('Content', sql.NVarChar, Content)
            .query('INSERT INTO Feedbacks (Household_ID, Title, Content) VALUES (@Household_ID, @Title, @Content)');
            
        res.status(201).json({ message: 'Gửi phản ánh thành công! Ban quản lý đã tiếp nhận yêu cầu.' });
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

module.exports = { 
    getMyInvoices, 
    createDeclaration, 
    getAvailableServices, 
    registerService, 
    getMyRegisteredServices,
    getAnnouncements,
    sendFeedback,
    addResident
};