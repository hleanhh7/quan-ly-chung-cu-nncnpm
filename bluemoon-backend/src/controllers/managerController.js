const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');


// API: Thêm hộ khẩu (Căn hộ) mới
const createHousehold = async (req, res) => {
    try {
        const { Room_Number, Owner_Name, Move_In_Date } = req.body;

        const request = new sql.Request();
        
        // Kiểm tra xem phòng này đã tồn tại chưa
        const checkRoom = await request
            .input('Room_Number', sql.VarChar, Room_Number)
            .query('SELECT * FROM Households WHERE Room_Number = @Room_Number');

        if (checkRoom.recordset.length > 0) {
            return res.status(400).json({ message: 'Số phòng này đã được đăng ký!' });
        }

        // Thêm hộ mới
        await request
            .input('Owner_Name', sql.NVarChar, Owner_Name)
            .input('Move_In_Date', sql.Date, Move_In_Date)
            .query(`
                INSERT INTO Households (Room_Number, Owner_Name, Move_In_Date) 
                VALUES (@Room_Number, @Owner_Name, @Move_In_Date)
            `);

        res.status(201).json({ message: 'Thêm hộ khẩu mới thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Thêm nhân khẩu vào một hộ
const addResident = async (req, res) => {
    try {
        const { Household_ID, Full_Name, Identity_Card, Date_Of_Birth, Phone_Number, Relation_With_Owner } = req.body;

        const request = new sql.Request();

        // Kiểm tra xem Hộ khẩu (Household_ID) có tồn tại không
        const checkHousehold = await request
            .input('Household_ID', sql.Int, Household_ID)
            .query('SELECT * FROM Households WHERE Household_ID = @Household_ID');

        if (checkHousehold.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin hộ khẩu này!' });
        }

        // Thêm nhân khẩu
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

// API: Tạo hóa đơn hàng tháng cho hộ khẩu
const createInvoice = async (req, res) => {
    try {
        const { Household_ID, Billing_Month, Billing_Year, Total_Amount } = req.body;

        const request = new sql.Request();

        // Kiểm tra xem Hộ khẩu có tồn tại không
        const checkHousehold = await request
            .input('Household_ID', sql.Int, Household_ID)
            .query('SELECT * FROM Households WHERE Household_ID = @Household_ID');

        if (checkHousehold.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin hộ khẩu này!' });
        }

        // Tạo hóa đơn mới
        await request
            .input('Billing_Month', sql.Int, Billing_Month)
            .input('Billing_Year', sql.Int, Billing_Year)
            .input('Total_Amount', sql.Decimal(18, 2), Total_Amount)
            .query(`
                INSERT INTO Invoices (Household_ID, Billing_Month, Billing_Year, Total_Amount) 
                VALUES (@Household_ID, @Billing_Month, @Billing_Year, @Total_Amount)
            `);

        res.status(201).json({ message: `Tạo hóa đơn tháng ${Billing_Month}/${Billing_Year} thành công!` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Lấy toàn bộ danh sách hộ khẩu để hiển thị lên bảng hoặc dropdown
const getAllHouseholds = async (req, res) => {
    try {
        const request = new sql.Request();
        // Lấy tất cả các hộ khẩu, sắp xếp theo số phòng
        const result = await request.query('SELECT * FROM Households ORDER BY Room_Number ASC');
        
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Cấp tài khoản cho Hộ dân
const createResidentAccount = async (req, res) => {
    try {
        const { Household_ID, Username, Password } = req.body;
        const request = new sql.Request();

        // 1. Kiểm tra xem Hộ khẩu này có tồn tại không
        const checkHousehold = await request
            .input('Household_ID', sql.Int, Household_ID)
            .query('SELECT * FROM Households WHERE Household_ID = @Household_ID');

        if (checkHousehold.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID Hộ khẩu này!' });
        }

        // 2. Kiểm tra tên đăng nhập đã có ai dùng chưa
        const checkUser = await request
            .input('Username', sql.VarChar, Username)
            .query('SELECT * FROM Accounts WHERE Username = @Username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!' });
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        // 4. Lưu tài khoản vào DB với Role mặc định là 'Resident'
        await request
            .input('Password_Hash', sql.VarChar, hashedPassword)
            .input('Role', sql.VarChar, 'Resident')
            .query(`
                INSERT INTO Accounts (Household_ID, Username, Password_Hash, Role) 
                VALUES (@Household_ID, @Username, @Password_Hash, @Role)
            `);

        res.status(201).json({ message: `Cấp tài khoản ${Username} cho Hộ ${Household_ID} thành công!` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Lấy danh sách các đơn khai báo đang chờ duyệt
const getPendingDeclarations = async (req, res) => {
    try {
        const request = new sql.Request();
        // Dùng JOIN để lấy thêm Tên người khai báo và Số phòng cho Quản lý dễ nhìn
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
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Cập nhật trạng thái đơn (Duyệt / Từ chối)
const updateDeclarationStatus = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID của đơn từ đường dẫn URL
        const { Status } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

        const request = new sql.Request();
        await request
            .input('Declaration_ID', sql.Int, id)
            .input('Status', sql.NVarChar, Status)
            .query(`
                UPDATE Declarations 
                SET Status = @Status 
                WHERE Declaration_ID = @Declaration_ID
            `);

        res.status(200).json({ message: `Đã ${Status.toLowerCase()} đơn khai báo thành công!` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Đổi trạng thái hộ khẩu thành "Đã chuyển đi"
const updateHouseholdStatus = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID hộ khẩu từ URL

        const request = new sql.Request();
        
        // 1. Cập nhật trạng thái Hộ khẩu
        await request
            .input('Household_ID', sql.Int, id)
            .input('Status', sql.NVarChar, 'Đã chuyển đi')
            .query(`
                UPDATE Households 
                SET Status = @Status 
                WHERE Household_ID = @Household_ID
            `);

        // 2. (Tùy chọn nâng cao) Xóa tài khoản Web của họ để họ không thể đăng nhập nữa
        await request
            .input('Household_ID_For_Account', sql.Int, id)
            .query(`
                DELETE FROM Accounts 
                WHERE Household_ID = @Household_ID_For_Account AND Role = 'Resident'
            `);

        res.status(200).json({ message: 'Đã cập nhật trạng thái Hộ khẩu thành "Đã chuyển đi" và thu hồi tài khoản Web!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Lấy toàn bộ danh sách hóa đơn của cả chung cư
const getAllInvoices = async (req, res) => {
    try {
        const request = new sql.Request();
        // Dùng JOIN để lấy thêm Số phòng hiển thị cho Quản lý
        const result = await request.query(`
            SELECT i.Invoice_ID, h.Room_Number, i.Billing_Month, i.Billing_Year, i.Total_Amount, i.Payment_Status
            FROM Invoices i
            JOIN Households h ON i.Household_ID = h.Household_ID
            ORDER BY i.Billing_Year DESC, i.Billing_Month DESC, h.Room_Number ASC
        `);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Đánh dấu hóa đơn đã được thanh toán
const payInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        
        await request
            .input('Invoice_ID', sql.Int, id)
            .input('Payment_Status', sql.NVarChar, 'Đã thanh toán') // Không dùng chữ N ở đây nữa nhé
            .query(`
                UPDATE Invoices 
                SET Payment_Status = @Payment_Status, Payment_Date = GETDATE()
                WHERE Invoice_ID = @Invoice_ID
            `);

        res.status(200).json({ message: 'Xác nhận thu tiền thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// API: Xem toàn bộ dịch vụ cư dân đang dùng (để biết đường tính tiền)
const getAllRegisteredServices = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT sr.Registration_ID, h.Room_Number, s.Service_Name, sr.Quantity, sr.Start_Date, 
                   (sr.Quantity * s.Unit_Price) AS Estimated_Cost
            FROM ServiceRegistrations sr
            JOIN Services s ON sr.Service_ID = s.Service_ID
            JOIN Households h ON sr.Household_ID = h.Household_ID
            ORDER BY h.Room_Number ASC, sr.Start_Date DESC
        `);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { createHousehold, addResident, createInvoice, getAllHouseholds, createResidentAccount, getPendingDeclarations, updateDeclarationStatus, updateHouseholdStatus, getAllInvoices, payInvoice, getAllRegisteredServices };