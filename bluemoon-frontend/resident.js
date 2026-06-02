// 1. KIỂM TRA BẢO MẬT KHI VỪA MỞ TRANG
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');

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
                // Đây là lúc chúng ta "quẹt thẻ" Token vào header
                'Authorization': `Bearer ${token}` 
            }
        });

        const invoices = await response.json();
        const tbody = document.getElementById('invoiceTableBody');
        tbody.innerHTML = ''; // Xóa dòng "Đang tải dữ liệu..."

        if (response.ok) {
            if (invoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">Bạn không có hóa đơn nào.</td></tr>';
            } else {
                // Duyệt qua từng hóa đơn và tạo thẻ <tr> tương ứng
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

// Gọi hàm tải hóa đơn ngay khi trang vừa load xong
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
            document.getElementById('declarationForm').reset(); // Xóa trắng form
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
});


// HÀM: Tải danh sách dịch vụ vào ô Select
async function fetchServices() {
    try {
        const response = await fetch('http://localhost:5000/api/resident/services', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const services = await response.json();
        const select = document.getElementById('serviceSelect');
        
        if (response.ok) {
            select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>'; // Xóa dòng chữ Đang tải
            services.forEach(svc => {
                // Hiển thị tên dịch vụ và giá tiền
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

// Gọi hàm ngay khi vào trang
fetchServices();

// XỬ LÝ: Gửi form đăng ký dịch vụ
document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        Service_ID: document.getElementById('serviceSelect').value,
        Quantity: document.getElementById('serviceQuantity').value,
        Start_Date: document.getElementById('serviceStartDate').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/resident/service-register', {
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
            document.getElementById('serviceForm').reset(); // Xóa trắng form
            fetchMyServices();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
});

// 4. XỬ LÝ ĐĂNG XUẤT(phải để cuối cùng khi cập nhật tất cả API khác)
document.getElementById('btnLogout').addEventListener('click', function() {
    // Hủy token trong két sắt
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    // Quay về trang đăng nhập
    window.location.href = 'index.html';
});

// HÀM: Tải danh sách dịch vụ đang sử dụng
async function fetchMyServices() {
    try {
        const response = await fetch('http://localhost:5000/api/resident/my-services', {
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
                            <td>${svc.Unit_Price.toLocaleString('vi-VN')} đồng/ ${svc.Calculation_Unit}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (error) {
        console.error('Lỗi tải dịch vụ:', error);
    }
}

fetchMyServices(); // Gọi hàm khi vào trang