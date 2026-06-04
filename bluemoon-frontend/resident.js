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
document.getElementById('declarationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        Resident_ID: document.getElementById('residentId').value,
        Declaration_Type: document.getElementById('decType').value,
        Start_Date: document.getElementById('startDate').value,
        End_Date: document.getElementById('endDate').value,
        Reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/resident/declaration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Gửi khai báo thành công!');
            document.getElementById('declarationForm').reset(); 
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
});


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



// Cấu hình đường dẫn API (Đảm bảo khớp với thư mục routes của bạn)
const RESIDENT_API_URL = 'http://localhost:5000/api/resident';

// =========================================================================
// 1. GỌI API: TẢI VÀ HIỂN THỊ BẢNG TIN
// =========================================================================
async function fetchAnnouncements() {
    try {
        const response = await fetch(`${RESIDENT_API_URL}/announcements`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const announcements = await response.json();
        const listContainer = document.getElementById('announcementList');
        listContainer.innerHTML = ''; 

        if (response.ok) {
            if (announcements.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Hiện chưa có thông báo nào từ Ban quản lý.</p>';
                return;
            }

            announcements.forEach(ann => {
                const date = new Date(ann.Created_At).toLocaleString('vi-VN');
                
                const item = `
                    <div style="border-bottom: 1px solid #ddd; padding-bottom: 12px; margin-bottom: 12px;">
                        <h4 style="color: #2980b9; margin: 0 0 8px 0; font-size: 16px;">📌 ${ann.Title}</h4>
                        <p style="margin: 0 0 8px 0; line-height: 1.5; color: #333;">${ann.Content}</p>
                        <small style="color: #95a5a6; font-style: italic;">🕒 Đăng lúc: ${date}</small>
                    </div>
                `;
                listContainer.innerHTML += item;
            });
        } else {
            console.error('Lỗi từ Server:', announcements.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối khi tải bảng tin:', error);
        document.getElementById('announcementList').innerHTML = '<p style="color: red; text-align: center;">Không thể kết nối đến máy chủ.</p>';
    }
}

// =========================================================================
// 2. GỌI API: GỬI PHẢN ÁNH / YÊU CẦU
// =========================================================================
document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Lấy dữ liệu và đảm bảo key là "Title" và "Content" (viết hoa chữ đầu) để khớp với Backend
    const payload = {
        Title: document.getElementById('fbTitle').value,
        Content: document.getElementById('fbContent').value
    };

    try {
        // Gọi đến endpoint /feedbacks như trong router bạn đã định nghĩa
        const response = await fetch(`${RESIDENT_API_URL}/feedbacks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            // Hiển thị câu: "Gui phan anh thanh cong! Ban quan ly da tiep nhan yeu cau."
            alert(result.message); 
            document.getElementById('feedbackForm').reset(); // Làm sạch form
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi khi gửi phản ánh:', error);
        alert('Lỗi mạng: Không thể gửi yêu cầu đến máy chủ!');
    }
});

// Khởi chạy việc tải bảng tin ngay khi Cư dân mở trang
fetchAnnouncements();


// ==================================================
// 5. XỬ LÝ ĐĂNG XUẤT (Nằm dưới cùng)
// ==================================================
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    localStorage.removeItem('household_id');
    window.location.href = 'index.html';
});