const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// API: Thêm hộ khẩu (Căn hộ) mới - Đã tích hợp Giới hạn và Kiểm tra mã phòng hợp lệ
const MAX_ROOMS = 379; 

// API: Tạo hộ khẩu VÀ Cấp tài khoản cùng lúc
const createHousehold = async (req, res) => {
    try {
        const { Room_Number, Owner_Name, Move_In_Date, Username, Password } = req.body;
        const request = new sql.Request();

        // 1. KIỂM TRA MÃ PHÒNG HỢP LỆ
        const roomString = String(Room_Number);
        const roomNumValue = parseInt(roomString.replace(/\D/g, '')); 
        if (!roomNumValue || roomNumValue > MAX_ROOMS) {
            return res.status(400).json({ message: `❌ Mã phòng không hợp lệ! Tối đa đến ${MAX_ROOMS}.` });
        }

        // 2. KIỂM TRA GIỚI HẠN SỐ PHÒNG
        const countResult = await request.query(`SELECT COUNT(*) as TotalActive FROM Households WHERE Status = N'Đang ở'`);
        if (countResult.recordset[0].TotalActive >= MAX_ROOMS) {
            return res.status(400).json({ message: `❌ Chung cư Bluemoon đã kín ${MAX_ROOMS} hộ.` });
        }

        // 3. KIỂM TRA TRÙNG LẶP PHÒNG
        const checkRoom = await request
            .input('Room_Number_Check', sql.VarChar, Room_Number)
            .query(`SELECT * FROM Households WHERE Room_Number = @Room_Number_Check AND Status = N'Đang ở'`);
        if (checkRoom.recordset.length > 0) {
            return res.status(400).json({ message: '❌ Căn hộ này hiện đang có hộ khác sinh sống!' });
        }

        // 4. KIỂM TRA USERNAME ĐÃ CÓ AI DÙNG CHƯA (MỚI)
        const checkUser = await request
            .input('Username', sql.VarChar, Username)
            .query(`SELECT * FROM Accounts WHERE Username = @Username`);
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: '❌ Tên đăng nhập này đã có người sử dụng, vui lòng chọn tên khác!' });
        }

        // 5. LƯU HỘ KHẨU VÀ LẤY NGAY ID VỪA ĐƯỢC TẠO RA
        const insertHousehold = await request
            .input('Room_Number', sql.VarChar, Room_Number)
            .input('Owner_Name', sql.NVarChar, Owner_Name)
            .input('Move_In_Date', sql.Date, Move_In_Date)
            .query(`
                INSERT INTO Households (Room_Number, Owner_Name, Move_In_Date, Status) 
                OUTPUT INSERTED.Household_ID
                VALUES (@Room_Number, @Owner_Name, @Move_In_Date, N'Đang ở')
            `);

        // Hứng lấy cái ID vừa được SQL cấp
        const newHouseholdId = insertHousehold.recordset[0].Household_ID;

        // 6. TẠO TÀI KHOẢN GẮN VỚI ID ĐÓ LUÔN
        const accountReq = new sql.Request();
        await accountReq
            .input('Household_ID', sql.Int, newHouseholdId)
            .input('Acc_Username', sql.VarChar, Username)
            .input('Acc_Password', sql.VarChar, Password) // Lưu ý: Cột trong DB của bạn là Password hay Password_Hash thì sửa lại cho khớp nhé
            .query(`
                INSERT INTO Accounts (Username, Password_Hash, Role, Household_ID) 
                VALUES (@Acc_Username, @Acc_Password, 'Resident', @Household_ID)
            `);

        res.status(201).json({ message: '🎉 Đã tạo Hộ khẩu và Cấp tài khoản Cư dân thành công!' });
    } catch (error) { 
        console.error("Lỗi tạo hộ khẩu & tài khoản:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};

// API: Thêm nhân khẩu vào một hộ
const addResident = async (req, res) => {
    try {
        const { Household_ID, Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner } = req.body;
        const request = new sql.Request();
        await request
            .input('Household_ID', sql.Int, Household_ID)
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
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Lấy toàn bộ danh sách hộ khẩu
const getAllHouseholds = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM Households ORDER BY Household_ID DESC');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Cấp tài khoản cho Hộ dân
const createResidentAccount = async (req, res) => {
    try {
        const { Household_ID, Username, Password } = req.body;
        const request = new sql.Request();

        const checkHousehold = await request
            .input('Household_ID', sql.Int, Household_ID)
            .query('SELECT * FROM Households WHERE Household_ID = @Household_ID');

        if (checkHousehold.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID Hộ khẩu này!' });
        }

        const checkUser = await request
            .input('Username', sql.VarChar, Username)
            .query('SELECT * FROM Accounts WHERE Username = @Username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        await request
            .input('Password_Hash', sql.VarChar, hashedPassword)
            .input('Role', sql.VarChar, 'Resident')
            .query(`
                INSERT INTO Accounts (Household_ID, Username, Password_Hash, Role) 
                VALUES (@Household_ID, @Username, @Password_Hash, @Role)
            `);

        res.status(201).json({ message: `Cấp tài khoản ${Username} cho Hộ ${Household_ID} thành công!` });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Lấy danh sách các đơn khai báo đang chờ duyệt
const getPendingDeclarations = async (req, res) => {
    try {
        const request = new sql.Request();
        const query = `
            SELECT d.Declaration_ID, d.Declaration_Type, d.Start_Date, d.End_Date, d.Reason,
                   r.Full_Name, h.Room_Number
            FROM Declarations d
            JOIN Residents r ON d.Resident_ID = r.Resident_ID
            JOIN Households h ON r.Household_ID = h.Household_ID
            WHERE d.Status = N'Chờ duyệt'
        `;
        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Cập nhật trạng thái đơn (Duyệt / Từ chối)
const updateDeclarationStatus = async (req, res) => {
    try {
        const { id } = req.params; 
        const { Status } = req.body; 
        const request = new sql.Request();
        await request
            .input('Declaration_ID', sql.Int, id)
            .input('Status', sql.NVarChar, Status)
            .query('UPDATE Declarations SET Status = @Status WHERE Declaration_ID = @Declaration_ID');

        res.status(200).json({ message: `Đã ${Status.toLowerCase()} đơn khai báo thành công!` });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Đổi trạng thái hộ khẩu thành "Đã chuyển đi"
const updateHouseholdStatus = async (req, res) => {
    try {
        const { id } = req.params; 
        const request = new sql.Request();
        
        await request
            .input('Household_ID', sql.Int, id)
            .input('Status', sql.NVarChar, 'Đã chuyển đi')
            .query('UPDATE Households SET Status = @Status WHERE Household_ID = @Household_ID');

        await request
            .input('Household_ID_For_Account', sql.Int, id)
            .query("DELETE FROM Accounts WHERE Household_ID = @Household_ID_For_Account AND Role = 'Resident'");

        res.status(200).json({ message: 'Đã cập nhật trạng thái Hộ khẩu và thu hồi tài khoản!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Lấy toàn bộ danh sách hóa đơn
const getAllInvoices = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT i.Invoice_ID, h.Room_Number, i.Billing_Month, i.Billing_Year, i.Total_Amount, i.Payment_Status
            FROM Invoices i
            JOIN Households h ON i.Household_ID = h.Household_ID
            ORDER BY i.Billing_Year DESC, i.Billing_Month DESC, h.Room_Number ASC
        `);
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Đánh dấu hóa đơn đã thanh toán
const payInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        await request
            .input('Invoice_ID', sql.Int, id)
            .input('Payment_Status', sql.NVarChar, 'Đã thanh toán')
            .query('UPDATE Invoices SET Payment_Status = @Payment_Status, Payment_Date = GETDATE() WHERE Invoice_ID = @Invoice_ID');
        res.status(200).json({ message: 'Xác nhận thu tiền thành công!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Xem toàn bộ dịch vụ cư dân đang dùng
const getAllRegisteredServices = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT sr.Registration_ID, h.Room_Number, s.Service_Name, sr.Quantity, sr.Start_Date, 
                   (sr.Quantity * s.Unit_Price) AS Estimated_Cost
            FROM ServiceRegistrations sr
            JOIN Services s ON sr.Service_ID = s.Service_ID
            JOIN Households h ON sr.Household_ID = h.Household_ID
            WHERE sr.Status = N'Đã duyệt'
            ORDER BY h.Room_Number ASC, sr.Start_Date DESC
        `);
        res.status(200).json(result.recordset);
    } catch (error) { 
        console.error("Lỗi lấy danh sách dịch vụ:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};

// API: Lấy danh sách đăng ký dịch vụ đang chờ duyệt
const getPendingServiceRequests = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT sr.Registration_ID as Request_ID, h.Room_Number, s.Service_Name, sr.Quantity, sr.Start_Date, sr.Status
            FROM ServiceRegistrations sr
            JOIN Households h ON sr.Household_ID = h.Household_ID
            JOIN Services s ON sr.Service_ID = s.Service_ID
            WHERE sr.Status = N'Chờ duyệt'
        `);
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// -------------------------------------------------------------------------
// 1. LUỒNG THỦ CÔNG: ADMIN TỰ TẠO HÓA ĐƠN PHÁT SINH
// -------------------------------------------------------------------------
// API: Phát hành hóa đơn thủ công (Đã chuẩn hóa theo Schema)
const createInvoice = async (req, res) => {
    try {
        const { Household_ID, Billing_Month, Billing_Year, Total_Amount } = req.body;
        const request = new sql.Request();

        // 1. Kiểm tra xem ID Hộ khẩu này có thực sự tồn tại trong DB không
        const checkHouse = await request
            .input('Check_ID', sql.Int, Household_ID)
            .query(`SELECT * FROM Households WHERE Household_ID = @Check_ID`);
            
        if (checkHouse.recordset.length === 0) {
            return res.status(400).json({ message: 'ID Hộ khẩu không tồn tại! Vui lòng nhập ID hợp lệ.' });
        }

        // 2. Chèn hóa đơn vào Database (Sử dụng đúng cột Payment_Status)
        await request
            .input('Household_ID', sql.Int, Household_ID)
            .input('Billing_Month', sql.Int, Billing_Month)
            .input('Billing_Year', sql.Int, Billing_Year)
            .input('Total_Amount', sql.Float, Total_Amount)
            .query(`
                INSERT INTO Invoices (Household_ID, Billing_Month, Billing_Year, Total_Amount, Payment_Status)
                VALUES (@Household_ID, @Billing_Month, @Billing_Year, @Total_Amount, N'Chưa thanh toán')
            `);

        res.status(201).json({ message: 'Phát hành hóa đơn thủ công thành công!' });
    } catch (error) {
        console.error("🔥 LỖI SQL TẠO HÓA ĐƠN:", error);
        res.status(500).json({ message: 'Lỗi SQL: ' + error.message }); 
    }
};
// -------------------------------------------------------------------------
// 2. LUỒNG TỰ ĐỘNG: DUYỆT DỊCH VỤ -> TỰ SINH HÓA ĐƠN
// -------------------------------------------------------------------------
const updateServiceRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body; 
        const request = new sql.Request();

        // 1. Cập nhật trạng thái
        await request
            .input('Status', sql.NVarChar, Status)
            .input('Request_ID', sql.Int, id)
            .query('UPDATE ServiceRegistrations SET Status = @Status WHERE Registration_ID = @Request_ID');

        // 2. Tự động sinh hóa đơn với đúng cột Unit_Price
        if (Status === 'Đã duyệt') {
            const infoReq = new sql.Request();
            infoReq.input('ReqID', sql.Int, id);
            
            const info = await infoReq.query(`
                SELECT sr.Household_ID, sr.Quantity, s.Unit_Price as DonGia
                FROM ServiceRegistrations sr
                JOIN Services s ON sr.Service_ID = s.Service_ID
                WHERE sr.Registration_ID = @ReqID
            `);

            if (info.recordset.length > 0) {
                const { Household_ID, Quantity, DonGia } = info.recordset[0];
                const Total_Amount = Quantity * (DonGia || 0); 
                
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();

                const invReq = new sql.Request();
                await invReq
                    .input('Household_ID', sql.Int, Household_ID)
                    .input('Month', sql.Int, currentMonth)
                    .input('Year', sql.Int, currentYear)
                    .input('Total_Amount', sql.Float, Total_Amount)
                    .query(`
                        INSERT INTO Invoices (Household_ID, Billing_Month, Billing_Year, Total_Amount, Payment_Status)
                        VALUES (@Household_ID, @Month, @Year, @Total_Amount, N'Chưa thanh toán')
                    `);
            }
        }

        res.status(200).json({ message: `Đã ${Status.toLowerCase()} dịch vụ và xử lý hóa đơn tương ứng!` });
    } catch (error) {
        console.error("LỖI DUYỆT DỊCH VỤ:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Phát hành thông báo (Đã fix lỗi sập DB)
const createAnnouncement = async (req, res) => {
    try {
        const { Title, Content } = req.body;
        const request = new sql.Request(); 
        await request
            .input('Title', sql.NVarChar, Title)
            .input('Content', sql.NVarChar, Content)
            .query('INSERT INTO Announcements (Title, Content) VALUES (@Title, @Content)');
            
        res.status(201).json({ message: 'Đã phát hành thông báo đến toàn thể cư dân thành công!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi máy chủ khi tạo thông báo', error: error.message }); }
};

// API: Lấy danh sách phản ánh
const getAllFeedbacks = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT f.Feedback_ID, f.Title, f.Content, f.Status, f.Created_At, h.Room_Number 
            FROM Feedbacks f 
            JOIN Households h ON f.Household_ID = h.Household_ID 
            ORDER BY f.Created_At DESC
        `);
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách phản ánh', error: error.message }); }
};

// API: Cập nhật tiến độ phản ánh
const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body; 
        const request = new sql.Request();
        await request
            .input('Status', sql.NVarChar, Status)
            .input('Feedback_ID', sql.Int, id)
            .query('UPDATE Feedbacks SET Status = @Status WHERE Feedback_ID = @Feedback_ID');
        res.status(200).json({ message: 'Đã cập nhật tiến độ xử lý phản ánh thành công!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi không thể cập nhật trạng thái', error: error.message }); }
};

// API: Duyệt đặt lịch tiện ích
const getPendingFacilityBookings = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT fb.Booking_ID, h.Room_Number, fb.Facility_Name, fb.Booking_Date, fb.Time_Slot, fb.Status
            FROM FacilityBookings fb
            JOIN Households h ON fb.Household_ID = h.Household_ID
            WHERE fb.Status = N'Chờ duyệt'
            ORDER BY fb.Booking_Date ASC
        `);
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

const updateFacilityBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body; 
        const request = new sql.Request();
        await request
            .input('Status', sql.NVarChar, Status)
            .input('Booking_ID', sql.Int, id)
            .query('UPDATE FacilityBookings SET Status = @Status WHERE Booking_ID = @Booking_ID');
        res.status(200).json({ message: `Đã ${Status.toLowerCase()} đặt lịch tiện ích thành công!` });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Quản lý danh mục các loại phí
const getAllServiceTypes = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query('SELECT * FROM Services ORDER BY Service_ID DESC');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// API: Thêm loại phí / dịch vụ mới
const createServiceType = async (req, res) => {
    try {
        const { Service_Name, Price } = req.body;
        const request = new sql.Request();
        
        // Cấp thêm Đơn vị tính (Calculation_Unit) mặc định là 'Tháng' để chiều lòng SQL Server
        await request
            .input('Service_Name', sql.NVarChar, Service_Name)
            .input('Unit_Price', sql.Float, Price)
            .query(`
                INSERT INTO Services (Service_Name, Unit_Price, Calculation_Unit) 
                VALUES (@Service_Name, @Unit_Price, N'Tháng')
            `);
            
        res.status(201).json({ message: 'Đã thêm loại phí/dịch vụ mới thành công!' });
    } catch (error) { 
        // In lỗi đỏ chót ra màn hình đen (Terminal) để dễ bắt bệnh
        console.error("LỖI SQL KHI THÊM DỊCH VỤ:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message }); 
    }
};

// Đổi giá tiền của một loại phí
const updateServicePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { Price } = req.body;
        const request = new sql.Request();
        await request
            .input('Unit_Price', sql.Float, Price)
            .input('Service_ID', sql.Int, id)
            .query('UPDATE Services SET Unit_Price = @Unit_Price WHERE Service_ID = @Service_ID');
        res.status(200).json({ message: '💰 Đã cập nhật giá mới thành công!' });
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

const deleteServiceType = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        await request
            .input('Service_ID', sql.Int, id)
            .query('DELETE FROM Services WHERE Service_ID = @Service_ID');
        res.status(200).json({ message: '🗑️ Đã xóa loại phí này khỏi hệ thống!' });
    } catch (error) { 
        res.status(500).json({ message: '❌ Không thể xóa vì cư dân đang sử dụng dịch vụ này!', error: error.message }); 
    }
};

// API: Xem danh sách nhân khẩu của một hộ cụ thể
const getResidentsByHousehold = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        const result = await request
            .input('Household_ID', sql.Int, id)
            .query('SELECT Full_Name, Identity_Card, Date_Of_Birth, Relation_With_Owner FROM Residents WHERE Household_ID = @Household_ID');
        res.status(200).json(result.recordset);
    } catch (error) { res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

// === LUÔN ĐỂ CÁI NÀY Ở DƯỚI CÙNG VÀ CHỨA TẤT CẢ CÁC HÀM ===
module.exports = { 
    createHousehold, 
    addResident, 
    createInvoice, 
    getAllHouseholds, 
    createResidentAccount, 
    getPendingDeclarations, 
    updateDeclarationStatus, 
    updateHouseholdStatus, 
    getAllInvoices, 
    payInvoice, 
    getAllRegisteredServices,
    getPendingServiceRequests,      
    updateServiceRequestStatus,
    createAnnouncement,
    getAllFeedbacks,
    updateFeedbackStatus,
    getPendingFacilityBookings,
    updateFacilityBookingStatus,
    getAllServiceTypes,
    createServiceType,
    updateServicePrice,
    deleteServiceType,
    getResidentsByHousehold
};