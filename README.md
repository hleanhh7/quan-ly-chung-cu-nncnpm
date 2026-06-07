# 🏢 Hệ Thống Quản Lý Chung Cư (BlueMoon Apartment Management System)

Dự án phần mềm Full-stack giúp số hóa và tự động hóa quy trình quản lý nhân khẩu, dịch vụ và tài chính cho một khu chung cư. Hệ thống được chia làm hai phân hệ rõ ràng dành cho **Ban Quản Lý** và **Cư Dân**, đảm bảo tính minh bạch và hiệu quả trong công tác vận hành.

---

## ✨ Chức năng nổi bật

### 👨‍💼 Dành cho Ban Quản Lý (Manager)
* **Quản lý Hộ khẩu & Nhân khẩu:** Thêm mới, theo dõi, và báo chuyển đi cho các hộ gia đình. Cấp tài khoản hệ thống cho chủ hộ.
* **Quản lý Tài chính:** Phát hành hóa đơn hàng tháng (tiền nhà, dịch vụ) và đánh dấu trạng thái thu tiền.
* **Duyệt đơn từ:** Xử lý và phê duyệt các đơn xin Tạm trú / Tạm vắng do cư dân gửi lên.
* **Thống kê Dịch vụ:** Theo dõi danh sách cư dân đang đăng ký sử dụng các dịch vụ (gửi xe máy, ô tô, dọn dẹp...) để làm căn cứ tính phí.
* **Quản lý Truyền thông & Phản hồi:** Phát hành thông báo toàn chung cư, tiếp nhận và cập nhật tiến độ xử lý phản ánh, khiếu nại từ cư dân.

### 👨‍👩‍👧‍👦 Dành cho Cư Dân (Resident)
* **Theo dõi Hóa đơn:** Xem lịch sử các khoản phí cần đóng và tình trạng thanh toán của phòng mình.
* **Đăng ký Dịch vụ:** Chủ động đăng ký thêm các gói dịch vụ trực tuyến.
* **Khai báo Tạm trú / Tạm vắng:** Gửi đơn khai báo trực tuyến lên Ban quản lý mà không cần xuống trực tiếp quầy lễ tân.
* **Tương tác trực tuyến:** Xem bảng tin chung cư, gửi yêu cầu sửa chữa, bảo trì hoặc phản ánh trực tiếp tới Ban quản lý.

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
* Microsoft SQL Server (Hỗ trợ cả bản Local và bản Express) & SQL Server Management Studio (SSMS)
* Git

---

## 🚀 Hướng dẫn cài đặt và chạy dự án (Setup Guide)

### Bước 1: Tải mã nguồn về máy
```bash
git clone [https://github.com/hleanhh7/quan-ly-chung-cu-nncnpm.git](https://github.com/hleanhh7/quan-ly-chung-cu-nncnpm.git)
cd quan-ly-chung-cu-nncnpm
```

### Bước 2: Khôi phục Cơ sở dữ liệu
1. Mở SQL Server Management Studio (SSMS).
2. Tạo một Database mới có tên là `BluemoonDB`.
3. Chạy file script SQL (nếu có) hoặc tạo các bảng theo cấu trúc thiết kế (`Accounts`, `Households`, `Residents`, `Services`, `Invoices`, `Declarations`, `Announcements`, `Feedbacks`, `ServiceRegistrations`...) để khởi tạo dữ liệu.

### Bước 3: Cài đặt thư viện cho Backend
Di chuyển vào thư mục backend và cài đặt các gói phụ thuộc:
```bash
cd bluemoon-backend
npm install
```

### Bước 4: Cấu hình biến môi trường
Tạo một file có tên chính xác là **`.env`** (⚠️ *Lưu ý gõ đúng chữ `env` - viết tắt của Environment, tránh gõ nhầm thành `.evn` khiến Node.js không đọc được cấu hình*) nằm ở thư mục gốc của `bluemoon-backend` và khai báo các thông số sau:

```env
PORT=5000
DB_USER=sa
DB_PASSWORD=Mat_Khau_SQL_Cua_Ban
DB_SERVER=127.0.0.1
DB_NAME=BluemoonDB
DB_PORT=1433
JWT_SECRET=mot_chuoi_ki_tu_bi_mat_bat_ky_cua_ban
```

### Bước 5: Khởi động Server Backend
Khởi động Backend bằng lệnh:
```bash
npm start
```
Nếu màn hình Terminal hiển thị dòng chữ xanh: `🎉 Ket noi SQL Server (SSMS) thanh cong voi database: BluemoonDB` tức là hệ thống Backend đã sẵn sàng nhận kết nối.

### Bước 6: Mở giao diện ứng dụng (Frontend)
Ứng dụng sử dụng cơ chế gọi API Client-Server hoàn toàn độc lập. Bạn chỉ cần mở trực tiếp các file `.html` trong thư mục `bluemoon-frontend` bằng trình duyệt web hoặc thiết lập một *Live Server* (Extension trên VS Code) tại thư mục Frontend để bắt đầu trải nghiệm hệ thống tại địa chỉ local.


Lưu ý, khi clone thì nên clone từ database trắng, folfder trắng, ở database đã có sẵn một số tài khoản resident với admin
Tài khoản admin có thể làm được nhiều cái hơn tài khoản register 
với tài khoản admin thì 
tk: admin_bluemoon
mk: admin123


với tài khoản register thì cũng có nhiều cái

tk: cudan_test101
mk: 123456 
hoặc tk : cudan-moi , mk ; 123456


---

## ⚠️ HƯỚNG DẪN FIX LỖI KẾT NỐI SQL SERVER (Dành cho người dùng mới)

Mặc định khi mới cài đặt SQL Server, Microsoft sẽ chặn quyền truy cập từ các ứng dụng bên ngoài (như Node.js). Nếu bạn gặp lỗi `Could not connect` hoặc `Login failed for user 'sa'`, hãy thực hiện cấu hình 3 bước sau trên máy của bạn:

### 1. Mở cổng mạng TCP/IP (Port 1433)
1. Bấm phím `Windows`, tìm kiếm phần mềm **SQL Server Configuration Manager** (Nếu không thấy, nhấn `Windows + R`, gõ `SQLServerManager16.msc` cho bản SSMS 20/SQL 2022 hoặc `SQLServerManager15.msc` cho bản SQL 2019).
2. Ở cột bên trái, click mở rộng mục **SQL Server Network Configuration** -> Chọn **Protocols for SQLEXPRESS** (hoặc Protocols tương ứng bản cài của bạn).
3. Ở khung bên phải, click chuột phải vào **TCP/IP** -> Chọn **Enable**.
4. Tiếp tục click đúp vào chữ **TCP/IP** -> Chuyển sang tab **IP Addresses** -> Kéo xuống tận cùng dưới đáy tìm mục **IPAll**.
5. Tại dòng **TCP Port**, nhập số `1433`. Bấm *Apply* và *OK*.

### 2. Cho phép đăng nhập hỗn hợp & Mở khóa tài khoản `sa`
1. Mở phần mềm **SSMS**, đăng nhập bằng chế độ `Windows Authentication`.
2. Click chuột phải vào tên Server ở trên cùng cột trái (`localhost\SQLEXPRESS`) -> Chọn **Properties** -> Chọn mục **Security** ở cột trái bảng hiện ra.
3. Tại mục *Server authentication*, tích chọn ô số 2: **SQL Server and Windows Authentication mode**. Bấm **OK**.
4. Quay lại cột trái SSMS, mở rộng mục **Security** -> **Logins** -> Click chuột phải vào tài khoản **sa** -> Chọn **Properties**.
5. Tại tab **General**, thiết lập lại mật khẩu mới cho tài khoản `sa`.
6. Tại tab **Status**, ở mục *Login*, tích chọn **Enabled** để mở khóa tài khoản. Bấm **OK**.

### 3. Áp dụng cấu hình (Khởi động lại dịch vụ)
1. Quay lại giao diện phần mềm **SQL Server Configuration Manager**.
2. Click chuột trái vào mục **SQL Server Services** ở cột bên trái.
3. Nhìn sang khung bên phải, click chuột phải vào dòng dịch vụ **SQL Server (SQLEXPRESS)** -> Chọn **Restart**. 
4. Bây giờ hệ thống SQL Server của bạn đã sẵn sàng bắt tay với Backend Node.js!

---

## 📂 Cấu trúc thư mục dự án

lưu ý, hiện nhớ check frontend để biết những chức năng hiện đã có 


```text
📦 quan-ly-chung-cu-nncnpm
 ┣ 📂 bluemoon-backend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 config       # Cấu hình kết nối SQL Server (mssql)
 ┃ ┃ ┣ 📂 controllers  # Xử lý logic nghiệp vụ (Hộ khẩu, Hóa đơn, Đơn từ, Tin tức, Phản ánh)
 ┃ ┃ ┣ 📂 middleware   # Xác thực Token JWT & Kiểm tra phân quyền (Manager / Resident)
 ┃ ┃ ┣ 📂 routes       # Định tuyến các cổng API phân hệ
 ┃ ┃ ┗ 📜 server.js    # File gốc khởi chạy ứng dụng Backend
 ┃ ┣ 📜 .env           # Cấu hình môi trường local (Không đẩy lên Git)
 ┃ ┣ 📜 .gitignore     # Khai báo loại bỏ thư mục node_modules và .env khi push Git
 ┃ ┗ 📜 package.json   # Quản lý phiên bản các thư viện Node.js
 ┗ 📂 bluemoon-frontend
   ┣ 📜 index.html              # Giao diện Đăng nhập hệ thống
   ┣ 📜 manager_dashboard.html  # Giao diện tổng quan và chức năng cho Ban Quản Lý
   ┣ 📜 resident_dashboard.html # Giao diện tổng quan và chức năng cho Cư Dân
   ┣ 📜 manager.js              # Logic Javascript, Fetch API tương tác phân hệ Quản lý
   ┗ 📜 resident.js             # Logic Javascript, Fetch API tương tác phân hệ Cư dân
```
4. Các chức năng cần update:
- gộp phần tạo hộ khẩu và cấp tài khoản thành 1
- thêm chức năng tinh chỉnh và quản lý các loại phí ( đã fix )
- sửa lại phần khai báo tạm trú tạm vắng: cần CCCD chứ ID nhân khẩu là gì?? ( đã fix , bây giờ 1 phòng chỉ đc cấp 1 tk do chủ hộ nắm và chủ hộ có chức năg thêm thông tin các nhân khẩu trong nhà để phục vụ khai báo hành chính )
- khi cư dân đăng kí dịch vụ, bên bql không nhận được danh sách để duyệt và bên cư dân, sau khi duyệt thì nên tự động tạo hóa đơn luôn chứ không cần phải có chức năng phát hành hóa đơn ( đã fix , ngoài ra vẫn giữ nguyên chức năng tạo hóa đơn thủ công cho trường hợp phí phát sinh )
