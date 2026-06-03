const { sql } = require('../config/db');

// API 1: Xem danh sách hóa đơn của nhà mình
const getMyInvoices = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        
        if (!householdId) {
            return res.status(403).json({ message: 'Tài khoản của bạn chưa được cấp phát cho hộ khẩu nào!' });
        }

        const request = new sql.Request();
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query('SELECT * FROM Invoices WHERE Household_ID = @Household_ID ORDER BY Billing_Year DESC, Billing_Month DESC');

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
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
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Lấy danh sách các dịch vụ hiện có
const getAvailableServices = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM Services');
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
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

        res.status(201).json({ message: 'Đăng ký dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Xem các dịch vụ hộ mình đang đăng ký
const getMyRegisteredServices = async (req, res) => {
    try {
        const householdId = req.user.householdId;
        const request = new sql.Request();
        
        const result = await request
            .input('Household_ID', sql.Int, householdId)
            .query(`
                SELECT sr.Registration_ID, s.Service_Name, sr.Quantity, sr.Start_Date, s.Unit_Price, s.Calculation_Unit
                FROM ServiceRegistrations sr
                JOIN Services s ON sr.Service_ID = s.Service_ID
                WHERE sr.Household_ID = @Household_ID
                ORDER BY sr.Start_Date DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// =========================================================================
// TINH NANG 4: XEM BANG TIN CHUNG CU (DANH CHO CU DAN)
// =========================================================================
const getAnnouncements = async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .query('SELECT * FROM Announcements ORDER BY Created_At DESC');
            
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Loi khong lay duoc thong bao', error: error.message });
    }
};

// =========================================================================
// TINH NANG 3: GUI YEU CAU SUA CHUA, BAO TRI, PHAN ANH (DANH CHO CU DAN)
// =========================================================================
const sendFeedback = async (req, res) => {
    try {
        const householdId = req.user.householdId; 
        const { Title, Content } = req.body;
        
        if (!householdId) {
            return res.status(403).json({ message: 'Tai khoan cua ban chua duoc lien ket voi can ho nao!' });
        }
        
        const pool = await sql.connect();
        await pool.request()
            .input('Household_ID', sql.Int, householdId)
            .input('Title', sql.NVarChar, Title)
            .input('Content', sql.NVarChar, Content)
            .query('INSERT INTO Feedbacks (Household_ID, Title, Content) VALUES (@Household_ID, @Title, @Content)');
            
        res.status(201).json({ message: 'Gui phan anh thanh cong! Ban quan ly da tiep nhan yeu cau.' });
    } catch (error) {
        res.status(500).json({ message: 'Loi khong the gui phan anh', error: error.message });
    }
};
const addResident = async (req, res) => {
    try {
        const { Household_ID, Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner } = req.body;
        const request = new sql.Request();

        const checkHousehold = await request
            .input('Household_ID', sql.Int, Household_ID)
            .query('SELECT * FROM Households WHERE Household_ID = @Household_ID');

        if (checkHousehold.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin hộ khẩu này!' });
        }

        await request
            .input('Full_Name', sql.NVarChar, Full_Name)
            .input('Identity_Card', sql.VarChar, Identity_Card)
            .input('Date_Of_Birth', sql.Date, Date_Of_Birth)
            .input('Phone_Number', sql.VarChar, Phone_Number)
            .input('Relation_With_Owner', sql.NVarChar, Relation_With_Owner)
            .query(`
                INSERT INTO Residents (Household_ID, Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner) 
                VALUES (@Household_ID, @Full_Name, @Identity_Card, @Date_Of_Birth, @Phone_Number, @Relation_With_Owner)
            `);

        res.status(201).json({ message: 'Thêm nhân khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// === LUÔN ĐỂ CÁI NÀY Ở DƯỚI CÙNG VÀ CHỨA TẤT CẢ CÁC HÀM ===
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