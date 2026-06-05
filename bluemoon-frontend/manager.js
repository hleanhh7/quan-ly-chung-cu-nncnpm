// =========================================================================
// 1. KIỂM TRA BẢO MẬT & KHỞI TẠO ĐỊA CHỈ API
// =========================================================================
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');
const API_BASE = 'http://localhost:5000/api/manager';

if (!token || role !== 'Manager') {
    alert('Truy cập bị từ chối. Chỉ dành cho Ban Quản Lý!');
    window.location.href = 'index.html';
}

// HÀM TIỆN ÍCH: Dùng để gọi API POST chung cho các form
async function callManagerApi(url, data, formId, callback) {
    try {
        const response = await fetch(url, {
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
            document.getElementById(formId).reset();
            if (callback) callback(); // Tải lại bảng nếu có truyền hàm callback
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        alert('Lỗi kết nối đến máy chủ!');
    }
}

// ==================================================
// 2. XỬ LÝ CÁC FORM GỬI DỮ LIỆU (TẠO MỚI)
// ==================================================
document.getElementById('formHousehold').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Room_Number: document.getElementById('roomNumber').value,
        Owner_Name: document.getElementById('ownerName').value,
        Move_In_Date: document.getElementById('moveInDate').value
    };
    callManagerApi(`${API_BASE}/household`, data, 'formHousehold', fetchHouseholds);
});

document.getElementById('formResident').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('resHouseholdId').value,
        Full_Name: document.getElementById('resFullName').value,
        Identity_Card: document.getElementById('resIdentity').value,
        Date_Of_Birth: document.getElementById('resDob').value,
        Relation_With_Owner: document.getElementById('resRelation').value
    };
    callManagerApi(`${API_BASE}/resident`, data, 'formResident');
});

document.getElementById('formInvoice').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('invHouseholdId').value,
        Billing_Month: document.getElementById('invMonth').value,
        Billing_Year: document.getElementById('invYear').value,
        Total_Amount: document.getElementById('invTotal').value
    };
    callManagerApi(`${API_BASE}/invoice`, data, 'formInvoice', fetchAllInvoices);
});

document.getElementById('formAccount').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('accHouseholdId').value,
        Username: document.getElementById('accUsername').value,
        Password: document.getElementById('accPassword').value
    };
    callManagerApi(`${API_BASE}/account`, data, 'formAccount');
});

// Phát Thông Báo
document.getElementById('formAnnouncement').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Title: document.getElementById('annTitle').value,
        Content: document.getElementById('annContent').value
    };
    callManagerApi(`${API_BASE}/announcements`, data, 'formAnnouncement');
});

document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    window.location.href = 'index.html';
});


// ==================================================
// 3. RENDER BẢNG VÀ CHỨC NĂNG CẬP NHẬT (GIAO DIỆN)
// ==================================================

// --- QUẢN LÝ HÓA ĐƠN ---
async function fetchAllInvoices() {
    try {
        const response = await fetch(`${API_BASE}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
        const invoices = await response.json();
        
        const tbody = document.getElementById('allInvoicesTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hóa đơn nào được tạo.</td></tr>';
        } else {
            invoices.forEach(inv => {
                const actionButton = inv.Payment_Status === 'Chưa thanh toán' 
                    ? `<button onclick="xacNhanThuTien(${inv.Invoice_ID})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Thu tiền</button>`
                    : `<span style="color: #27ae60; font-weight: bold;">Hoàn tất</span>`;

                const statusColor = inv.Payment_Status === 'Chưa thanh toán' ? '#e74c3c' : '#27ae60';

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${inv.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${inv.Billing_Month}/${inv.Billing_Year}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${Number(inv.Total_Amount).toLocaleString('vi-VN')} đ</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${inv.Payment_Status}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi tải hóa đơn:', error); }
}

window.xacNhanThuTien = async function(id) {
    if (!confirm('Xác nhận hộ dân này đã đóng tiền?')) return;
    try {
        const response = await fetch(`${API_BASE}/invoice/${id}/pay`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchAllInvoices(); // Tải lại bảng ngay lập tức
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi xử lý API:', error); }
};

// --- QUẢN LÝ HỘ KHẨU & LỊCH SỬ CHUYỂN ĐI ---
async function fetchHouseholds() {
    try {
        const response = await fetch(`${API_BASE}/households`, { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        const households = await response.json();
        const tbodyActive = document.getElementById('householdTableBody');
        
        // Chỉ cần kiểm tra bảng Active (vì bảng History đã bay sang trang khác)
        if(!tbodyActive) return; 
        
        tbodyActive.innerHTML = '';

        // BƯỚC BẢO VỆ: Chỉ vẽ bảng khi Server trả về mã OK (200)
        if (response.ok) {
            let hasActive = false;

            households.forEach(hh => {
                const moveInDate = hh.Move_In_Date ? new Date(hh.Move_In_Date).toLocaleDateString('vi-VN') : '';

                // SỬA CHỮ: Kiểm tra đúng chữ "Đang cư trú" hoặc "Đang ở" để bao quát hết dữ liệu
                if (hh.Status === 'Đang cư trú' || hh.Status === 'Đang ở' || !hh.Status) {
                    hasActive = true;
                    // Sửa lại tên hàm thành updateHouseholdStatus cho khớp với code gốc
                    const actionButton = `<button onclick="updateHouseholdStatus(${hh.Household_ID}, 'Đã chuyển đi')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Báo chuyển đi</button>`;
                    
                    tbodyActive.innerHTML += `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad;">${hh.Household_ID}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hh.Room_Number}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${hh.Owner_Name}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2ecc71;">${hh.Status || 'Đang cư trú'}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                        </tr>
                    `;
                }
            });

            if (!hasActive) {
                tbodyActive.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có hộ khẩu nào đang ở.</td></tr>';
            }
            
        } else {
            // Xử lý báo lỗi nếu Backend sập
            tbodyActive.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Lỗi Server: ${households.message}</td></tr>`;
        }

    } catch (error) { 
        console.error('Lỗi kết nối:', error); 
        const tbodyActive = document.getElementById('householdTableBody');
        if(tbodyActive) tbodyActive.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Mất kết nối đến máy chủ!</td></tr>';
    }
}

window.markAsMovedOut = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn báo hộ này đã chuyển đi? Tài khoản Web của hộ này cũng sẽ bị vô hiệu hóa!')) return;
    try {
        const response = await fetch(`${API_BASE}/household/${id}/status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchHouseholds(); // Tự động load lại cả 2 bảng Hộ khẩu và Lịch sử
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi xử lý API:', error); }
};

// --- DỊCH VỤ VÀ TẠM TRÚ ---
async function fetchDeclarations() {
    try {
        const response = await fetch(`${API_BASE}/declarations`, { headers: { 'Authorization': `Bearer ${token}` } });
        const declarations = await response.json();
        
        const tbody = document.getElementById('declarationTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (declarations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có đơn nào đang chờ duyệt.</td></tr>';
        } else {
            declarations.forEach(dec => {
                const startDate = dec.Start_Date ? new Date(dec.Start_Date).toLocaleDateString('vi-VN') : '';
                const endDate = dec.End_Date ? new Date(dec.End_Date).toLocaleDateString('vi-VN') : '';
                const loai = dec.Declaration_Type === 'TamTru' ? 'Tạm trú' : 'Tạm vắng';

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${dec.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${dec.Full_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${loai}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startDate} - ${endDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${dec.Reason}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            <button onclick="updateDeclaration(${dec.Declaration_ID}, 'Đã duyệt')" style="background-color: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Duyệt</button>
                            <button onclick="updateDeclaration(${dec.Declaration_ID}, 'Từ chối')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi kết nối:', error); }
}

window.updateDeclaration = async function(id, status) {
    if (!confirm(`Bạn có chắc muốn ${status.toLowerCase()} đơn này?`)) return;
    try {
        const response = await fetch(`${API_BASE}/declaration/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ Status: status })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchDeclarations(); 
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi API:', error); }
};

async function fetchAllRegisteredServices() {
    try {
        const response = await fetch(`${API_BASE}/registered-services`, { headers: { 'Authorization': `Bearer ${token}` } });
        const services = await response.json();
        
        const tbody = document.getElementById('allServicesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hộ nào đăng ký dịch vụ.</td></tr>';
        } else {
            services.forEach(svc => {
                const startDate = svc.Start_Date ? new Date(svc.Start_Date).toLocaleDateString('vi-VN') : '';
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${svc.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${svc.Service_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${svc.Quantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #e67e22; font-weight: bold;">${Number(svc.Estimated_Cost).toLocaleString('vi-VN')} đ</td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi tải danh sách dịch vụ:', error); }
}

async function fetchServiceRequests() {
    try {
        const response = await fetch(`${API_BASE}/service-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
        const pending = await response.json();
        
        const tbody = document.getElementById('bangDuyetDichVu'); 
        if (!tbody) return;
        tbody.innerHTML = '';

        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có yêu cầu nào chờ duyệt.</td></tr>';
        } else {
            pending.forEach(req => {
                const sentDate = req.Start_Date ? new Date(req.Start_Date).toLocaleDateString('vi-VN') : '';
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${req.Request_ID}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${sentDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${req.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${req.Service_Name}</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">SL: ${req.Quantity || 1}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            <span style="color: #e67e22; font-weight: bold;">Chờ duyệt</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            <button onclick="handleServiceRequest(${req.Request_ID}, 'Đã duyệt')" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; margin-right: 5px;">Duyệt</button>
                            <button onclick="handleServiceRequest(${req.Request_ID}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi tải yêu cầu dịch vụ:', error); }
}

window.handleServiceRequest = async function(id, status) {
    if (!confirm(`Bạn có chắc muốn ${status.toLowerCase()} yêu cầu đăng ký này?`)) return;
    try {
        const response = await fetch(`${API_BASE}/service-request/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ Status: status })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchServiceRequests(); 
            fetchAllRegisteredServices(); // Load lại luôn bảng dịch vụ đang dùng nếu vừa duyệt
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi API:', error); }
};

// ==================================================
// 4. KÍCH HOẠT TẢI DỮ LIỆU KHI VỪA MỞ TRANG
// ==================================================
fetchAllInvoices();
fetchHouseholds(); 
fetchDeclarations();
fetchAllRegisteredServices();
fetchServiceRequests();

// =========================================================================
// CHỨC NĂNG BÁO CHUYỂN ĐI (Dành cho Ban Quản Lý)
// =========================================================================
window.updateHouseholdStatus = async function(householdId, newStatus) {
    if (!confirm('Xác nhận: Báo hộ này đã chuyển đi?')) return;

    try {
        // Đảm bảo biến token đã được lấy đúng tên
        const currentToken = localStorage.getItem('bluemoon_token') || localStorage.getItem('token');

        const response = await fetch(`http://localhost:5000/api/manager/household/${householdId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ Status: newStatus })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchHouseholds(); // Gọi lại hàm tải bảng để dòng chữ "Đang cư trú" biến mất
        } else {
            alert('Lỗi từ Server: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        alert('Mất kết nối đến máy chủ!');
    }
};
