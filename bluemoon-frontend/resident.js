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


// ==================================================
// 5. XỬ LÝ ĐĂNG XUẤT (Nằm dưới cùng)
// ==================================================
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    localStorage.removeItem('household_id');
    window.location.href = 'index.html';
});