# Backend Hệ thống Quản lý Chung cư

Đây là kho lưu trữ mã nguồn Backend cho hệ thống Quản lý nhân khẩu và thu phí chung cư, phục vụ cho đồ án môn Nhập môn Công nghệ phần mềm tại Đại học Bách Khoa Hà Nội (HUST).

## 🛠 Công nghệ sử dụng
*   **Ngôn ngữ:** Java
*   **Framework:** Spring Boot
*   **Cơ sở dữ liệu:** MySQL / PostgreSQL (Cập nhật lại theo CSDL bạn dùng)
*   **Quản lý thư viện:** Maven

## ⚙️ Hướng dẫn cài đặt và chạy Project

### 1. Yêu cầu hệ thống
*   Đã cài đặt **JDK 17** (hoặc phiên bản bạn đang dùng).
*   Đã cài đặt hệ quản trị cơ sở dữ liệu tương ứng.
*   IDE khuyên dùng: IntelliJ IDEA.

### 2. Cấu hình Database
Trước khi chạy chương trình, bạn cần tạo một database trống dưới máy (ví dụ: `quan_ly_chung_cu`). Sau đó, mở file `src/main/resources/application.properties` và cấu hình lại các thông số kết nối:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quan_ly_chung_cu
spring.datasource.username=root
spring.datasource.password=123456
spring.jpa.hibernate.ddl-auto=update
