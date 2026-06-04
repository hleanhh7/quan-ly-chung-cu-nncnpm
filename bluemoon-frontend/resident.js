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
        ID: Date.now(),
        Declaration_Type: document.getElementById('decType').value,
        Start_Date: document.getElementById('startDate').value,
        End_Date: document.getElementById('endDate').value,
        Reason: document.getElementById('reason').value,
        Status: 'Chờ duyệt',
        Created_At: new Date().toISOString()
    };

    const ds = JSON.parse(localStorage.getItem('declarations') || '[]');
    ds.push(data);
    localStorage.setItem('declarations', JSON.stringify(ds));

    alert('Gửi khai báo thành công!');
    document.getElementById('declarationForm').reset();
    loadLichSuKhaiBao();
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
// Thay thế hàm 4.2 cũ bằng hàm này
document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        household_id: household_id,
        service_id: document.getElementById('serviceSelect').value,
        quantity: document.getElementById('serviceQuantity').value,
        start_date: document.getElementById('serviceStartDate').value,
        status: 'Chờ duyệt' // Luôn để trạng thái chờ
    };

    try {
        // Gọi API gửi yêu cầu (Ông cần tạo API này ở backend: POST /api/services/request)
        const response = await fetch('http://localhost:5000/api/services/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Đăng ký thành công! Vui lòng chờ Ban quản lý xét duyệt.');
            document.getElementById('serviceForm').reset();
            // Tải lại bảng trạng thái dịch vụ (ông nên làm 1 bảng riêng hiển thị các yêu cầu đang chờ)
        } else {
            alert('Lỗi đăng ký dịch vụ.');
        }
    } catch (error) {
        console.error('Lỗi:', error);
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