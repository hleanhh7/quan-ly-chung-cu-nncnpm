-- 1. Tạo Cơ sở dữ liệu
CREATE DATABASE BluemoonDB;
GO
USE BluemoonDB;
GO

-- 2. Bảng Hộ khẩu / Căn hộ (Households)
CREATE TABLE Households (
    Household_ID INT IDENTITY(1,1) PRIMARY KEY,
    Room_Number VARCHAR(10) NOT NULL UNIQUE, -- Ví dụ: P101, A-2005
    Owner_Name NVARCHAR(100) NOT NULL,
    Move_In_Date DATE NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Đang ở' -- Đang ở, Đã chuyển đi, Trống
);
GO

-- 3. Bảng Nhân khẩu (Residents)
CREATE TABLE Residents (
    Resident_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Full_Name NVARCHAR(100) NOT NULL,
    Identity_Card VARCHAR(20) NULL, -- CCCD/Hộ chiếu
    Date_Of_Birth DATE NOT NULL,
    Phone_Number VARCHAR(15) NULL,
    Relation_With_Owner NVARCHAR(50) NOT NULL, -- Chủ hộ, Vợ, Chồng, Con, Thuê nhà...
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE CASCADE
);
GO

-- 4. Bảng Tài khoản đăng nhập (Accounts)
CREATE TABLE Accounts (
    Account_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NULL, -- Nếu là Quản lý (Admin) thì có thể để NULL
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL, -- Lưu mật khẩu đã băm (Bcrypt)
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Manager', 'Resident')),
    Created_At DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE SET NULL
);
GO

-- 5. Bảng Danh mục Dịch vụ (Services)
CREATE TABLE Services (
    Service_ID INT IDENTITY(1,1) PRIMARY KEY,
    Service_Name NVARCHAR(100) NOT NULL UNIQUE,
    Unit_Price DECIMAL(18, 2) NOT NULL, -- Giá tiền
    Calculation_Unit NVARCHAR(50) NOT NULL, -- Khối (m3), Kwh, Xe/Tháng, Hộ/Tháng
    Is_Mandatory BIT DEFAULT 0 -- 1: Phí bắt buộc (vệ sinh, quản lý), 0: Phí đăng ký thêm (gửi xe)
);
GO

-- 6. Bảng Đăng ký Dịch vụ (ServiceRegistrations)
CREATE TABLE ServiceRegistrations (
    Registration_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Start_Date DATE NOT NULL,
    End_Date DATE NULL,
    Quantity INT DEFAULT 1, -- Ví dụ: số lượng xe máy đăng ký
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE CASCADE,
    FOREIGN KEY (Service_ID) REFERENCES Services(Service_ID) ON DELETE CASCADE
);
GO

-- 7. Bảng Hóa đơn phí dịch vụ hàng tháng (Invoices)
CREATE TABLE Invoices (
    Invoice_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Billing_Month INT NOT NULL CHECK (Billing_Month BETWEEN 1 AND 12),
    Billing_Year INT NOT NULL,
    Total_Amount DECIMAL(18, 2) NOT NULL,
    Payment_Status NVARCHAR(30) DEFAULT N'Chưa thanh toán', -- Chưa thanh toán, Đã thanh toán
    Payment_Date DATETIME NULL,
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE CASCADE
);
GO

-- 8. Bảng Khai báo Tạm trú / Tạm vắng (Declarations)
CREATE TABLE Declarations (
    Declaration_ID INT IDENTITY(1,1) PRIMARY KEY,
    Resident_ID INT NOT NULL,
    Declaration_Type VARCHAR(20) NOT NULL CHECK (Declaration_Type IN ('TamTru', 'TamVang')),
    Start_Date DATE NOT NULL,
    End_Date DATE NOT NULL,
    Reason NVARCHAR(255) NOT NULL,
    Status NVARCHAR(30) DEFAULT N'Chờ duyệt', -- Chờ duyệt, Đã duyệt, Từ chối
    FOREIGN KEY (Resident_ID) REFERENCES Residents(Resident_ID) ON DELETE CASCADE
);
GO

-- 9. Bảng Chi tiết Hóa đơn (InvoiceDetails)
CREATE TABLE InvoiceDetails (
    Detail_ID INT IDENTITY(1,1) PRIMARY KEY,
    Invoice_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Quantity INT DEFAULT 1, -- Số lượng (ví dụ: 2 chiếc xe máy, 10 khối nước)
    Unit_Price DECIMAL(18, 2) NOT NULL, -- Giá tại thời điểm chốt hóa đơn
    SubTotal DECIMAL(18, 2) NOT NULL, -- Thành tiền = Quantity * Unit_Price
    FOREIGN KEY (Invoice_ID) REFERENCES Invoices(Invoice_ID) ON DELETE CASCADE,
    FOREIGN KEY (Service_ID) REFERENCES Services(Service_ID)
);
GO

-- =========================================================================
-- CÁC BẢNG BỔ SUNG CHO TÍNH NĂNG MỚI (PHẢN ÁNH, THÔNG BÁO, TIỆN ÍCH)
-- =========================================================================

-- 10. Bảng Quản lý phản ánh, khiếu nại (Feedbacks)
CREATE TABLE Feedbacks (
    Feedback_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Chờ xử lý', -- Chờ xử lý, Đang giải quyết, Đã hoàn thành
    Created_At DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE CASCADE
);
GO

-- 11. Bảng Thông báo truyền thông chung (Announcements)
CREATE TABLE Announcements (
    Announcement_ID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Created_By NVARCHAR(50) DEFAULT N'Ban Quản Lý',
    Created_At DATETIME DEFAULT GETDATE()
);
GO

-- 12. Bảng Đặt lịch sử dụng tiện ích công cộng (FacilityBookings)
CREATE TABLE FacilityBookings (
    Booking_ID INT IDENTITY(1,1) PRIMARY KEY,
    Household_ID INT NOT NULL,
    Facility_Name NVARCHAR(100) NOT NULL, -- Gym, Hồ bơi, BBQ...
    Booking_Date DATE NOT NULL,
    Time_Slot VARCHAR(50) NOT NULL, -- Ví dụ: 18:00 - 20:00
    Status NVARCHAR(50) DEFAULT N'Đã xác nhận', -- Chờ xác nhận, Đã xác nhận, Đã hủy
    FOREIGN KEY (Household_ID) REFERENCES Households(Household_ID) ON DELETE CASCADE
);
GO

-- =========================================================================
-- ĐOẠN LỆNH TEST (Lưu ý: Cần có dữ liệu trong bảng Households và Accounts trước khi chạy)
-- =========================================================================
USE BluemoonDB;
GO

-- UPDATE Accounts SET Household_ID = 1 WHERE Username = 'cudan_a101';
-- SELECT Username, Role, Household_ID FROM Accounts WHERE Username = 'cudan_a101';
-- UPDATE Accounts SET Household_ID = 1 WHERE Username = 'cudan_a101';