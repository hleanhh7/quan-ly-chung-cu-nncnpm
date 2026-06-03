// 1. KIỂM TRA BẢO MẬT KHI VỪA MỞ TRANG
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');
// Lấy ID hộ gia đình từ thông tin đăng nhập (Tạm để 1 nếu hệ thống đăng nhập của bạn chưa lưu ID này)
const household_id = localStorage.getItem('household_id') || 1; 

// Nếu không có Token hoặc không phải Resident -> Đuổi về trang đăng nhập
if (!token || role !== 'Resident') {
    alert('Bạn không có quyền truy cập trang này hoặc chưa đăng nhập!');
    window.location.href = 'index.html';
}

// 2. HÀM LẤY DANH SÁCH HÓA ĐƠN
async function fetchInvoices() {
    try {
        const response = await fetch('http://localhost:5000/api/resident/invoices', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });

        const invoices = await response.json();
        const tbody = document.getElementById('invoiceTableBody');
        tbody.innerHTML = ''; 

        if (response.ok) {
            if (invoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">Bạn không có hóa đơn nào.</td></tr>';
            } else {
                invoices.forEach(inv => {
                    const row = `
                        <tr>
                            <td>${inv.Billing_Month}/${inv.Billing_Year}</td>
                            <td>${inv.Total_Amount.toLocaleString('vi-VN')} đ</td>
                            <td style="color: ${inv.Payment_Status === 'Chưa thanh toán' ? 'red' : 'green'}; font-weight: bold;">
                                ${inv.Payment_Status}
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        } else {
            alert('Lỗi tải hóa đơn: ' + invoices.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
}
fetchInvoices();

// 3. XỬ LÝ GỬI FORM KHAI BÁO


// ==================================================
// 4. MODULE: QUẢN LÝ DỊCH VỤ CỐ ĐỊNH (SERVICES)
// ==================================================

// 4.1 Tải danh sách dịch vụ vào ô Select
async function fetchServices() {
    try {
        const response = await fetch('http://localhost:5000/api/services/list', {
            method: 'GET'
        });

        const services = await response.json();
        const select = document.getElementById('serviceSelect');
        
        if (response.ok) {
            select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>'; 
            services.forEach(svc => {
                const option = document.createElement('option');
                option.value = svc.Service_ID;
                option.textContent = `${svc.Service_Name} (${svc.Unit_Price.toLocaleString('vi-VN')} đ/${svc.Calculation_Unit})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi tải dịch vụ:', error);
    }
}
fetchServices();

// 4.2 XỬ LÝ: Gửi form đăng ký dịch vụ
document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        household_id: household_id, // ID của hộ gia đình
        service_id: document.getElementById('serviceSelect').value,
        quantity: document.getElementById('serviceQuantity').value,
        start_date: document.getElementById('serviceStartDate').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/services/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Thành công: ' + result.message);
            document.getElementById('serviceForm').reset(); 
            fetchMyServices(); // Tự động load lại bảng dịch vụ đang dùng
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
});

// 4.3 HÀM: Tải danh sách dịch vụ đang sử dụng
async function fetchMyServices() {
    try {
        const response = await fetch(`http://localhost:5000/api/services/my-services/${household_id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const services = await response.json();
        const tbody = document.getElementById('myServicesTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (services.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Bạn chưa đăng ký dịch vụ nào.</td></tr>';
            } else {
                services.forEach(svc => {
                    const startDate = new Date(svc.Start_Date).toLocaleDateString('vi-VN');
                    const row = `
                        <tr>
                            <td>${svc.Service_Name}</td>
                            <td>${svc.Quantity}</td>
                            <td>${startDate}</td>
                            <td>${svc.Unit_Price.toLocaleString('vi-VN')} đ/${svc.Calculation_Unit}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (error) {
        console.error('Lỗi tải dịch vụ đang dùng:', error);
    }
}
fetchMyServices(); 


// ==================================================
// 5. XỬ LÝ ĐĂNG XUẤT (Nằm dưới cùng)
// ==================================================
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    localStorage.removeItem('household_id');
    window.location.href = 'index.html';
});

// ========================================================
// XỬ LÝ ĐẶT LỊCH TIỆN ÍCH (FACILITY BOOKING)
// ========================================================

const API_BOOKING_URL = 'http://localhost:5000/api/services/facility-bookings';

// 1. Hàm load lịch sử đặt chỗ của hộ gia đình
async function loadMyBookings() {
    try {
        const response = await fetch(API_BOOKING_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Token được kế thừa từ đầu file resident.js
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            const tbody = document.getElementById('bookingList');
            tbody.innerHTML = ''; // Xóa dữ liệu cũ
            
            bookings.forEach(b => {
                // Cắt lấy phần ngày tháng năm cho đẹp (bỏ đuôi giờ loằng ngoằng)
                const dateOnly = b.Booking_Date.split('T')[0];
                
                // Tô màu trạng thái
                let statusColor = 'orange';
                if (b.Status === 'Đã xác nhận' || b.Status === 'Approved') statusColor = 'green';
                if (b.Status === 'Từ chối' || b.Status === 'Rejected') statusColor = 'red';

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px;">${b.Facility_Name}</td>
                        <td>${dateOnly}</td>
                        <td>${b.Time_Slot}</td>
                        <td style="color: ${statusColor}; font-weight: bold;">${b.Status}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error('Lỗi khi load lịch sử đặt chỗ:', error);
    }
}

// 2. Bắt sự kiện khi cư dân bấm nút "Đặt lịch ngay"
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn trang tự reload
    
    const facility_name = document.getElementById('facilityName').value;
    const booking_date = document.getElementById('bookingDate').value;
    const time_slot = document.getElementById('timeSlot').value;

    try {
        const response = await fetch(API_BOOKING_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ facility_name, booking_date, time_slot })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('🎉 Đặt lịch thành công! Vui lòng chờ BQL xác nhận.');
            loadMyBookings(); // Tải lại bảng ngay lập tức để thấy đơn vừa đặt
        } else {
            alert('❌ Lỗi: ' + data.message); // Báo lỗi nếu trùng lịch
        }
    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu đặt lịch:', error);
        alert('Không thể kết nối với máy chủ!');
    }
});

// 3. Gọi hàm load bảng lịch sử ngay khi trang vừa tải xong
loadMyBookings();