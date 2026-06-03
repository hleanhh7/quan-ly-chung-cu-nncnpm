# 🏢 Hệ Thống Quản Lý Chung Cư (BlueMoon Apartment Management System)

Dự án phần mềm Full-stack giúp số hóa và tự động hóa quy trình quản lý nhân khẩu, dịch vụ và tài chính cho một khu chung cư. Hệ thống được chia làm hai phân hệ rõ ràng dành cho **Ban Quản Lý** và **Cư Dân**, đảm bảo tính minh bạch và hiệu quả trong công tác vận hành.

---

## ✨ Chức năng nổi bật

### 👨‍💼 Dành cho Ban Quản Lý (Manager)
* **Quản lý Hộ khẩu & Nhân khẩu:** Thêm mới, theo dõi, và báo chuyển đi cho các hộ gia đình. Cấp tài khoản hệ thống cho chủ hộ.
* **Quản lý Tài chính:** Phát hành hóa đơn hàng tháng (tiền nhà, dịch vụ) và đánh dấu trạng thái thu tiền.
* **Duyệt đơn từ:** Xử lý và phê duyệt các đơn xin Tạm trú / Tạm vắng do cư dân gửi lên.
* **Thống kê Dịch vụ:** Theo dõi danh sách cư dân đang đăng ký sử dụng các dịch vụ (gửi xe máy, ô tô, dọn dẹp...) để làm căn cứ tính phí.

### 👨‍👩‍👧‍👦 Dành cho Cư Dân (Resident)
* **Theo dõi Hóa đơn:** Xem lịch sử các khoản phí cần đóng và tình trạng thanh toán của phòng mình.
* **Đăng ký Dịch vụ:** Chủ động đăng ký thêm các gói dịch vụ trực tuyến.
* **Khai báo Tạm trú / Tạm vắng:** Gửi đơn khai báo trực tuyến lên Ban quản lý mà không cần xuống trực tiếp quầy lễ tân.

---

## 🛠 Công nghệ sử dụng

* **Backend:** Node.js, Express.js
* **Cơ sở dữ liệu:** Microsoft SQL Server (sử dụng thư viện `mssql`)
* **Bảo mật:** JSON Web Token (JWT) để xác thực người dùng, `bcryptjs` để mã hóa mật khẩu.
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Sử dụng Fetch API để giao tiếp với Server).

---

## ⚙️ Yêu cầu hệ thống (Prerequisites)

Vui lòng đảm bảo máy tính của bạn đã cài đặt các phần mềm sau trước khi chạy dự án:
* [Node.js](https://nodejs.org/) (Phiên bản LTS)
* Microsoft SQL Server & SQL Server Management Studio (SSMS)
* Git

---

## 🚀 Hướng dẫn cài đặt và chạy dự án (Setup Guide)

##Bước 1: Tải mã nguồn về máy**
```bash
git clone [https://github.com/hleanhh7/quan-ly-chung-cu-nncnpm.git](https://github.com/hleanhh7/quan-ly-chung-cu-nncnpm.git)
cd quan-ly-chung-cu-nncnpm

##Bước 2: Khôi phục Cơ sở dữ liệu
Mở SQL Server Management Studio (SSMS).
Tạo một Database mới có tên là BluemoonDB.
Chạy file script SQL (nếu có) hoặc copy các lệnh tạo bảng (Tables: Accounts, Households, Residents, Services, Invoices...) để khởi tạo cấu trúc dữ liệu ban đầu.

##Bước 3: Cài đặt thư viện
Di chuyển vào thư mục backend và cài đặt các gói phụ thuộc:
cd bluemoon-backend
npm install

##Bước 4: Cấu hình biến môi trường
Tạo một file có tên là .env nằm ở thư mục gốc của bluemoon-backend và khai báo các thông số kết nối Database của máy bạn:
PORT=5000
DB_USER=sa
DB_PASSWORD=Mat_Khau_SQL_Cua_Ban
DB_SERVER=localhost
DB_NAME=BluemoonDB
JWT_SECRET=mot_chuoi_ki_tu_bi_mat_bat_ky_cua_ban

##Bước 5: Khởi động Server
Khởi động Backend bằng lệnh:
npm run dev

##Bước 6: Mở giao diện ứng dụng
Bật trình duyệt web (Chrome/Edge/Firefox), mở các file .html trong thư mục bluemoon-frontend hoặc thiết lập một Live Server để bắt đầu sử dụng.

📂 Cấu trúc thư mục dự án:

📦 quan-ly-chung-cu-nncnpm
 ┣ 📂 bluemoon-backend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 config       # File cấu hình kết nối CSDL
 ┃ ┃ ┣ 📂 controllers  # Xử lý logic hệ thống (Manager, Resident, Auth)
 ┃ ┃ ┣ 📂 middleware   # Kiểm tra bảo mật Token & Phân quyền
 ┃ ┃ ┣ 📂 routes       # Định nghĩa các đường dẫn API
 ┃ ┃ ┗ 📜 server.js    # File gốc khởi chạy Backend
 ┃ ┣ 📜 .env           # File cấu hình môi trường (Không đẩy lên Git)
 ┃ ┣ 📜 .gitignore     # Khai báo các file bỏ qua khi push Git
 ┃ ┗ 📜 package.json   # Quản lý các thư viện Node.js
 ┗ 📂 bluemoon-frontend
   ┣ 📜 index.html              # Giao diện Đăng nhập
   ┣ 📜 manager_dashboard.html  # Giao diện Quản lý
   ┣ 📜 resident_dashboard.html # Giao diện Cư dân
   ┣ 📜 manager.js              # Logic xử lý giao diện Quản lý
   ┗ 📜 resident.js             # Logic xử lý giao diện Cư dân
