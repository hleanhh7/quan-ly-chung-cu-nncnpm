-- ========================================================
-- 1. KHỞI TẠO VÀ SỬ DỤNG DATABASE SẠCH
-- ========================================================
CREATE DATABASE BluemoonDB;
GO
USE BluemoonDB;
GO

-- ========================================================
-- 2. CẤU TRÚC CÁC BẢNG (CREATE TABLES)
-- ========================================================

-- Bảng 1: Tài khoản hệ thống
CREATE TABLE Accounts (
    Account_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role = 'Resident' OR Role = 'Manager'),
    Created_At DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 2: Hộ khẩu / Căn hộ
CREATE TABLE Households (
    Household_ID INT IDENTITY(1,1) PRIMARY KEY,
    Room_Number VARCHAR(10) NOT NULL UNIQUE,
    Owner_Name NVARCHAR(100) NOT NULL,
    Move_In_Date DATE NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Đang ở'
);
GO

-- Bảng 3: Nhân khẩu (Cư dân)
CREATE TABLE Residents (
    Resident_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Full_Name NVARCHAR(100) NOT NULL,
    Identity_Card VARCHAR(20) NULL,
    Date_Of_Birth DATE NOT NULL,
    Phone_Number VARCHAR(15) NULL,
    Relation_With_Owner NVARCHAR(50) NOT NULL
);
GO

-- Bảng 4: Thông báo truyền thông chung
CREATE TABLE Announcements (
    Announcement_ID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Created_By NVARCHAR(50) DEFAULT N'Ban Quản Lý',
    Created_At DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 5: Khai báo hành chính (Tạm trú / Tạm vắng)
CREATE TABLE Declarations (
    Declaration_ID INT IDENTITY(1,1) PRIMARY KEY,
    Resident_ID INT NOT NULL,
    Declaration_Type VARCHAR(20) NOT NULL CHECK (Declaration_Type = 'TamVang' OR Declaration_Type = 'TamTru'),
    Start_Date DATE NOT NULL,
    End_Date DATE NOT NULL,
    Reason NVARCHAR(255) NOT NULL,
    Status NVARCHAR(30) DEFAULT N'Chờ duyệt'
);
GO

-- Bảng 6: Đặt lịch sử dụng tiện ích công cộng
CREATE TABLE FacilityBookings (
    Booking_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NULL,
    Facility_Name NVARCHAR(100) NOT NULL,
    Booking_Date DATE NOT NULL,
    Start_Time TIME(7) NOT NULL,
    End_Time TIME(7) NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Chờ duyệt',
    Created_At DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 7: Phản ánh, khiếu nại của cư dân
CREATE TABLE Feedbacks (
    Feedback_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Chờ xử lý',
    Created_At DATETIME DEFAULT GETDATE()
);
GO

-- Bảng 8: Danh mục dịch vụ chung cư
CREATE TABLE Services (
    Service_ID INT IDENTITY(1,1) PRIMARY KEY,
    Service_Name NVARCHAR(100) NOT NULL UNIQUE,
    Unit_Price DECIMAL(18, 2) NOT NULL,
    Calculation_Unit NVARCHAR(50) NOT NULL,
    Is_Mandatory BIT DEFAULT 0
);
GO

-- Bảng 9: Đăng ký sử dụng dịch vụ dài hạn
CREATE TABLE ServiceRegistrations (
    Registration_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Start_Date DATE NOT NULL,
    End_Date DATE NULL,
    Quantity INT DEFAULT 1
);
GO

-- Bảng 10: Hóa đơn hàng tháng
CREATE TABLE Invoices (
    Invoice_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Billing_Month INT NOT NULL CHECK (Billing_Month >= 1 AND Billing_Month <= 12),
    Billing_Year INT NOT NULL,
    Total_Amount DECIMAL(18, 2) NOT NULL,
    Payment_Status NVARCHAR(30) DEFAULT N'Chưa thanh toán',
    Payment_Date DATETIME NULL
);
GO

-- Bảng 11: Chi tiết các khoản phí trong hóa đơn
CREATE TABLE InvoiceDetails (
    Detail_ID INT IDENTITY(1,1) PRIMARY KEY,
    Invoice_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Quantity INT DEFAULT 1,
    Unit_Price DECIMAL(18, 2) NOT NULL,
    SubTotal DECIMAL(18, 2) NOT NULL
);
GO

-- ========================================================
-- 3. RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS)
-- ========================================================
ALTER TABLE Accounts ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID) ON DELETE SET NULL;
ALTER TABLE Declarations ADD FOREIGN KEY (Resident_ID) REFERENCES Residents (Resident_ID) ON DELETE CASCADE;
ALTER TABLE FacilityBookings ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID);
ALTER TABLE Feedbacks ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID) ON DELETE CASCADE;
ALTER TABLE Residents ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID) ON DELETE CASCADE;
ALTER TABLE ServiceRegistrations ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID) ON DELETE CASCADE;
ALTER TABLE ServiceRegistrations ADD FOREIGN KEY (Service_ID) REFERENCES Services (Service_ID) ON DELETE CASCADE;
ALTER TABLE Invoices ADD FOREIGN KEY (Household_ID) REFERENCES Households (Household_ID) ON DELETE CASCADE;
ALTER TABLE InvoiceDetails ADD FOREIGN KEY (Invoice_ID) REFERENCES Invoices (Invoice_ID) ON DELETE CASCADE;
ALTER TABLE InvoiceDetails ADD FOREIGN KEY (Service_ID) REFERENCES Services (Service_ID);
GO

-- ========================================================
-- 4. DỮ LIỆU MẪU (INSERT DATA)
-- ========================================================

-- Đổ dữ liệu vào bảng Hộ khẩu
SET IDENTITY_INSERT Households ON;
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (1, N'TEST-101', N'Nguyễn Cảnh Test', '2026-06-01', N'Đang ở')
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (2, N'101', N'Nguyễn Văn A', '2026-06-03', N'Đang ở')
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (3, N'102', N'Nguyễn Văn B', '2026-06-03', N'Đang ở')
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (4, N'103', N'Phạm Minh C', '2026-06-03', N'Đang ở')
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (5, N'104', N'Lê Hoàng D', '2026-06-03', N'Đang ở')
INSERT Households (Household_ID, Room_Number, Owner_Name, Move_In_Date, Status) VALUES (6, N'123', N'1231', '0012-12-12', N'Đang ở')
SET IDENTITY_INSERT Households OFF;
GO

-- Đổ dữ liệu vào bảng Tài khoản
SET IDENTITY_INSERT Accounts ON;
INSERT Accounts (Account_ID, Household_ID, Username, Password_Hash, Role, Created_At) VALUES (4, 2, 'cudan_test101', '$2b$10$o0DZ51zrON2EwMudN8yfr.CqqxCsHz9gQPufqtaxF5dM69D4Uae9i', 'Resident', '2026-06-03 20:01:17.937')
INSERT Accounts (Account_ID, Household_ID, Username, Password_Hash, Role, Created_At) VALUES (5, 3, 'cudan_test102', '$2a$10$wE8wY.A4G/92Z4p9NnN/kOcE3WfN0QjT2u1I.O.p1yH4rO7eQ5Pxa', 'Resident', '2026-06-03 20:01:17.937')
INSERT Accounts (Account_ID, Household_ID, Username, Password_Hash, Role, Created_At) VALUES (6, 4, 'cudan_test103', '$2b$10$9c0beCPehil.4c2C08fw.elW72pBhr0V.c6DJaFo9lv.X9r1ZlgL2', 'Resident', '2026-06-03 20:15:46.113')
INSERT Accounts (Account_ID, Household_ID, Username, Password_Hash, Role, Created_At) VALUES (7, 5, 'cudan_test104', '$2a$10$oY75N2pEqo4vVptR9Wf9ne5N3w2.wF/eE5W1u1E6vY/z5e8A9cT/G', 'Resident', '2026-06-03 20:15:46.113')
INSERT Accounts (Account_ID, Household_ID, Username, Password_Hash, Role, Created_At) VALUES (8, NULL, 'admin_bluemoon', '$2b$10$0g/2roaOF3TJaNtgBfJJau1zqx0B9ITy.NzVCSwo1v4bM9oRICt3K', 'Manager', '2026-06-03 20:53:08.317')
SET IDENTITY_INSERT Accounts OFF;
GO

-- Đổ dữ liệu vào bảng Danh mục dịch vụ
SET IDENTITY_INSERT Services ON;
INSERT Services (Service_ID, Service_Name, Unit_Price, Calculation_Unit, Is_Mandatory) VALUES (1, N'Phí quản lý vận hành', 8000.00, N'm2/Tháng', 1)
INSERT Services (Service_ID, Service_Name, Unit_Price, Calculation_Unit, Is_Mandatory) VALUES (2, N'Gửi xe máy', 100000.00, N'Tháng/Xe', 0)
INSERT Services (Service_ID, Service_Name, Unit_Price, Calculation_Unit, Is_Mandatory) VALUES (3, N'Gửi ô tô', 1200000.00, N'Tháng/Xe', 0)
INSERT Services (Service_ID, Service_Name, Unit_Price, Calculation_Unit, Is_Mandatory) VALUES (4, N'Dọn vệ sinh căn hộ', 150000.00, N'Lượt', 0)
INSERT Services (Service_ID, Service_Name, Unit_Price, Calculation_Unit, Is_Mandatory) VALUES (5, N'Internet Cáp quang', 250000.00, N'Tháng', 0)
SET IDENTITY_INSERT Services OFF;
GO

-- 1. Thêm cột Trạng thái cho Đăng ký dịch vụ
ALTER TABLE ServiceRegistrations 
ADD Status NVARCHAR(30) DEFAULT N'Chờ duyệt';
GO

-- 2. Thêm cột Ngày tạo để biết cư dân gửi yêu cầu lúc nào
ALTER TABLE ServiceRegistrations 
ADD Created_At DATETIME DEFAULT GETDATE();
GO
