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

async function callManagerApi(url, data, formId, callback) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert('Thành công: ' + result.message);
            const form = document.getElementById(formId);
            if (form) form.reset();
            if (callback) callback(); 
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        alert('Lỗi kết nối đến máy chủ!');
    }
}

// ==================================================
// 2. XỬ LÝ CÁC FORM GỬI DỮ LIỆU (ĐƯỢC BẢO VỆ)
// ==================================================
const formHousehold = document.getElementById('formHousehold');
if (formHousehold) {
    formHousehold.addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            Room_Number: document.getElementById('roomNumber').value,
            Owner_Name: document.getElementById('ownerName').value,
            Move_In_Date: document.getElementById('moveInDate').value
        };
        callManagerApi(`${API_BASE}/household`, data, 'formHousehold', fetchHouseholds);
    });
}

const formResident = document.getElementById('formResident');
if (formResident) {
    formResident.addEventListener('submit', function(e) {
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
}

// ---> LUỒNG 1: TẠO HÓA ĐƠN THỦ CÔNG <---
const formInvoice = document.getElementById('formInvoice');
if (formInvoice) {
    formInvoice.addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            Household_ID: document.getElementById('invHouseholdId').value,
            Billing_Month: document.getElementById('invMonth').value,
            Billing_Year: document.getElementById('invYear').value,
            Total_Amount: document.getElementById('invTotal').value
        };
        try {
            const response = await fetch(`${API_BASE}/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                alert('🎉 ' + result.message);
                document.getElementById('formInvoice').reset();
                // Tự động load lại bảng hóa đơn và biểu đồ
                fetchAllInvoices();
                loadKPIs();
                drawCharts();
            } else {
                alert('❌ Lỗi: ' + result.message);
            }
        } catch (error) { console.error('Lỗi API tạo hóa đơn thủ công:', error); }
    });
}

const formAccount = document.getElementById('formAccount');
if (formAccount) {
    formAccount.addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            Household_ID: document.getElementById('accHouseholdId').value,
            Username: document.getElementById('accUsername').value,
            Password: document.getElementById('accPassword').value
        };
        callManagerApi(`${API_BASE}/account`, data, 'formAccount');
    });
}

const formAnnouncement = document.getElementById('formAnnouncement');
if (formAnnouncement) {
    formAnnouncement.addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            Title: document.getElementById('annTitle').value,
            Content: document.getElementById('annContent').value
        };
        callManagerApi(`${API_BASE}/announcements`, data, 'formAnnouncement');
    });
}

const formAddServiceType = document.getElementById('formAddServiceType');
if (formAddServiceType) {
    formAddServiceType.addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            Service_Name: document.getElementById('newServiceName').value,
            Price: document.getElementById('newServicePrice').value
        };
        try {
            const response = await fetch(`${API_BASE}/service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert((await response.json()).message);
                formAddServiceType.reset();
                loadServiceTypes();
            }
        } catch (error) { console.error('Lỗi thêm phí:', error); }
    });
}

const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', function() {
        localStorage.removeItem('bluemoon_token');
        localStorage.removeItem('bluemoon_role');
        window.location.href = 'index.html';
    });
}

// ==================================================
// 3. RENDER BẢNG VÀ CHỨC NĂNG CẬP NHẬT
// ==================================================
async function fetchAllInvoices() {
    try {
        const response = await fetch(`${API_BASE}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
        const invoices = await response.json();
        const tbody = document.getElementById('allInvoicesTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hóa đơn nào.</td></tr>';
        } else {
            invoices.forEach(inv => {
                const actionButton = inv.Payment_Status === 'Chưa thanh toán' 
                    ? `<button onclick="moModalThuTien(${inv.Invoice_ID}, ${inv.Total_Amount})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Thu tiền</button>`
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

let currentInvoiceId = null;
let currentInvoiceTotal = 0;

window.moModalThuTien = function(id, total) {
    currentInvoiceId = id;
    currentInvoiceTotal = total;
    document.getElementById('mt_maHD').innerText = '#' + id;
    document.getElementById('mt_tongTien').innerText = total.toLocaleString('vi-VN');
    document.getElementById('mt_khachDua').value = '';
    document.getElementById('mt_tienThua').innerText = '0';
    document.getElementById('mt_tienThua').style.color = '#27ae60';
    document.getElementById('modalThuTien').style.display = 'block';
}

window.dongModalThuTien = function() { document.getElementById('modalThuTien').style.display = 'none'; }

window.tinhTienThua = function() {
    const khachDua = parseInt(document.getElementById('mt_khachDua').value) || 0;
    const hienThi = document.getElementById('mt_tienThua');
    const tienThua = khachDua - currentInvoiceTotal;
    if (tienThua < 0) { hienThi.innerText = 'Chưa đủ tiền!'; hienThi.style.color = '#e74c3c'; } 
    else { hienThi.innerText = tienThua.toLocaleString('vi-VN'); hienThi.style.color = '#27ae60'; }
}

window.xacNhanThuTien = async function() {
    const khachDua = parseInt(document.getElementById('mt_khachDua').value) || 0;
    if (khachDua < currentInvoiceTotal) { alert('❌ Khách đưa chưa đủ tiền!'); return; }
    try {
        const response = await fetch(`${API_BASE}/invoice/${currentInvoiceId}/pay`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('🎉 Thu tiền thành công!');
            dongModalThuTien();
            fetchAllInvoices();
            drawCharts(); 
            loadKPIs();
        }
    } catch (error) { console.error('Lỗi thu tiền:', error); }
}

async function fetchHouseholds() {
    try {
        const response = await fetch(`${API_BASE}/households`, { headers: { 'Authorization': `Bearer ${token}` } });
        const households = await response.json();
        const tbodyActive = document.getElementById('householdTableBody');
        const tbodyHistory = document.getElementById('moveOutHistoryBody');
        if(!tbodyActive || !tbodyHistory) return;
        tbodyActive.innerHTML = ''; tbodyHistory.innerHTML = '';
        let hasActive = false, hasHistory = false;

        households.forEach(hh => {
            const moveInDate = hh.Move_In_Date ? new Date(hh.Move_In_Date).toLocaleDateString('vi-VN') : '';
            if (hh.Status === 'Đang ở') {
                hasActive = true;
                const btn = `<button onclick="markAsMovedOut(${hh.Household_ID})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Báo chuyển đi</button>`;
                tbodyActive.innerHTML += `<tr><td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad;">${hh.Household_ID}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hh.Room_Number}</td><td style="padding: 10px; border: 1px solid #ddd;">${hh.Owner_Name}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2ecc71;">${hh.Status}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${btn}</td></tr>`;
            } else {
                hasHistory = true;
                tbodyHistory.innerHTML += `<tr><td style="padding:10px; border:1px solid #ddd; text-align:center;">${hh.Room_Number}</td><td style="padding:10px; border:1px solid #ddd;">${hh.Owner_Name}</td><td style="padding:10px; border:1px solid #ddd; text-align:center;">${moveInDate}</td><td style="padding:10px; border:1px solid #ddd; text-align:center; color:#e74c3c; font-weight:bold;">Đã chuyển đi</td></tr>`;
            }
        });
        if (!hasActive) tbodyActive.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có hộ khẩu nào đang ở.</td></tr>';
        if (!hasHistory) tbodyHistory.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có hộ nào chuyển đi.</td></tr>';
    } catch (error) { console.error('Lỗi kết nối:', error); }
}

window.markAsMovedOut = async function(id) {
    if (!confirm('Báo hộ này đã chuyển đi? Tài khoản Web cũng sẽ bị vô hiệu hóa!')) return;
    try {
        const response = await fetch(`${API_BASE}/household/${id}/status`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }});
        if (response.ok) { alert('Thành công'); fetchHouseholds(); loadKPIs(); }
    } catch (error) { console.error('Lỗi:', error); }
};

async function fetchDeclarations() {
    try {
        const response = await fetch(`${API_BASE}/declarations`, { headers: { 'Authorization': `Bearer ${token}` } });
        const declarations = await response.json();
        const tbody = document.getElementById('declarationTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (declarations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có đơn nào chờ duyệt.</td></tr>';
        } else {
            declarations.forEach(dec => {
                const start = dec.Start_Date ? new Date(dec.Start_Date).toLocaleDateString('vi-VN') : '';
                const end = dec.End_Date ? new Date(dec.End_Date).toLocaleDateString('vi-VN') : '';
                const loai = dec.Declaration_Type === 'TamTru' ? 'Tạm trú' : 'Tạm vắng';
                tbody.innerHTML += `<tr><td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${dec.Room_Number}</td><td style="padding: 10px; border: 1px solid #ddd;">${dec.Full_Name}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${loai}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${start} - ${end}</td><td style="padding: 10px; border: 1px solid #ddd;">${dec.Reason}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><button onclick="updateDeclaration(${dec.Declaration_ID}, 'Đã duyệt')" style="background-color: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Duyệt</button> <button onclick="updateDeclaration(${dec.Declaration_ID}, 'Từ chối')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button></td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi:', error); }
}

window.updateDeclaration = async function(id, status) {
    if (!confirm(`Bạn chắc muốn ${status.toLowerCase()} đơn này?`)) return;
    try {
        const response = await fetch(`${API_BASE}/declaration/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ Status: status })});
        if (response.ok) { alert('Thành công!'); fetchDeclarations(); loadKPIs(); }
    } catch (error) { console.error('Lỗi:', error); }
};

async function fetchAllRegisteredServices() {
    try {
        const response = await fetch(`${API_BASE}/registered-services`, { headers: { 'Authorization': `Bearer ${token}` } });
        const services = await response.json();
        const tbody = document.getElementById('allServicesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có dịch vụ đăng ký.</td></tr>';
        } else {
            services.forEach(svc => {
                const startDate = svc.Start_Date ? new Date(svc.Start_Date).toLocaleDateString('vi-VN') : '';
                tbody.innerHTML += `<tr><td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${svc.Room_Number}</td><td style="padding: 10px; border: 1px solid #ddd;">${svc.Service_Name}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${svc.Quantity}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startDate}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #e67e22; font-weight: bold;">${Number(svc.Estimated_Cost).toLocaleString('vi-VN')} đ</td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi tải:', error); }
}

async function fetchServiceRequests() {
    try {
        const response = await fetch(`${API_BASE}/service-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
        const pending = await response.json();
        const tbody = document.getElementById('bangDuyetDichVu'); 
        if (!tbody) return;
        tbody.innerHTML = '';
        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có yêu cầu chờ duyệt.</td></tr>';
        } else {
            pending.forEach(req => {
                const date = req.Start_Date ? new Date(req.Start_Date).toLocaleDateString('vi-VN') : '';
                tbody.innerHTML += `<tr><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${req.Request_ID}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${date}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${req.Room_Number}</td><td style="padding: 10px; border: 1px solid #ddd;"><strong>${req.Service_Name}</strong></td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">SL: ${req.Quantity || 1}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><span style="color: #e67e22; font-weight: bold;">Chờ duyệt</span></td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><button onclick="handleServiceRequest(${req.Request_ID}, 'Đã duyệt')" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; margin-right: 5px;">Duyệt</button> <button onclick="handleServiceRequest(${req.Request_ID}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button></td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi tải:', error); }
}

// ---> LUỒNG 2: TỰ ĐỘNG SINH HÓA ĐƠN KHI DUYỆT DỊCH VỤ <---
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
            alert('🎉 ' + result.message);
            // Load lại các bảng liên quan NGAY LẬP TỨC
            fetchServiceRequests(); 
            fetchAllRegisteredServices(); 
            fetchAllInvoices(); 
            drawCharts();
            loadKPIs();
        } else {
            alert('❌ Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi API:', error); }
};

async function loadFacilityBookings() {
    try {
        const response = await fetch(`${API_BASE}/facility-bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tbody = document.getElementById('bangDuyetTienIch');
        if (!tbody) return;
        if (response.ok) {
            const bookings = await response.json();
            tbody.innerHTML = '';
            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: #7f8c8d;">Không có đặt lịch chờ duyệt.</td></tr>';
                return;
            }
            bookings.forEach(b => {
                const dateOnly = new Date(b.Booking_Date).toLocaleDateString('vi-VN');
                tbody.innerHTML += `<tr><td style="text-align:center;">#${b.Booking_ID}</td><td style="text-align:center;"><strong>${b.Room_Number}</strong></td><td style="text-align:center;">${b.Facility_Name}</td><td style="text-align:center; color: #2980b9; font-weight: bold;">${dateOnly}</td><td style="text-align:center;">${b.Time_Slot}</td><td style="color: #f39c12; font-weight: bold; text-align:center;">${b.Status}</td><td style="text-align:center;"><button onclick="xuLyDatLich(${b.Booking_ID}, 'Đã duyệt')" style="background: #27ae60; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold; margin-right: 5px;">Duyệt</button> <button onclick="xuLyDatLich(${b.Booking_ID}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">Từ chối</button></td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi:', error); }
}

window.xuLyDatLich = async function(id, status) {
    if (!confirm(`Bạn chắc chắn muốn ${status.toUpperCase()}?`)) return;
    try {
        const response = await fetch(`${API_BASE}/facility-booking/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ Status: status }) });
        if (response.ok) { alert(`Đã ${status.toLowerCase()} thành công!`); loadFacilityBookings(); loadKPIs(); }
    } catch (error) { console.error('Lỗi:', error); }
}

async function loadFeedbacks() {
    try {
        const response = await fetch(`${API_BASE}/feedbacks`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tbody = document.getElementById('bangQuanLyPhanAnh');
        if (!tbody) return;
        if (response.ok) {
            const feedbacks = await response.json();
            tbody.innerHTML = '';
            if (feedbacks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #7f8c8d;">Chưa có phản ánh.</td></tr>'; return;
            }
            feedbacks.forEach(fb => {
                const dateOnly = new Date(fb.Created_At).toLocaleDateString('vi-VN');
                let color = fb.Status === 'Đã xử lý' ? '#27ae60' : (fb.Status === 'Đang xử lý' ? '#3498db' : '#f39c12');
                tbody.innerHTML += `<tr><td style="text-align:center;">${dateOnly}</td><td style="text-align:center; font-weight:bold; color:#2980b9;">${fb.Room_Number}</td><td><strong>${fb.Title}</strong></td><td style="text-align:left; max-width: 300px;">${fb.Content}</td><td style="color:${color}; font-weight:bold; text-align:center;">${fb.Status}</td><td style="text-align:center;"><select onchange="capNhatTrangThaiPhanAnh(${fb.Feedback_ID}, this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer;"><option value="" disabled selected>Đổi trạng thái...</option><option value="Đang xử lý">Đang xử lý</option><option value="Đã xử lý">Đã xử lý</option></select></td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi:', error); }
}

window.capNhatTrangThaiPhanAnh = async function(id, newStatus) {
    if (!confirm(`Chuyển phản ánh thành "${newStatus}"?`)) { loadFeedbacks(); return; }
    try {
        const response = await fetch(`${API_BASE}/feedback/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ Status: newStatus }) });
        if (response.ok) { alert('Cập nhật thành công!'); loadFeedbacks(); }
    } catch (error) { console.error('Lỗi:', error); }
}

async function loadServiceTypes() {
    try {
        const response = await fetch(`${API_BASE}/services`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tbody = document.getElementById('serviceTypesTableBody');
        if (!tbody) return;
        if (response.ok) {
            const services = await response.json();
            tbody.innerHTML = '';
            if (services.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có loại phí.</td></tr>'; return; }
            services.forEach(svc => {
                const giaTien = svc.Price !== undefined ? svc.Price : (svc.Unit_Price !== undefined ? svc.Unit_Price : (svc.Cost || 0));
                tbody.innerHTML += `<tr><td style="text-align: center; color: #7f8c8d; font-weight: bold;">#${svc.Service_ID}</td><td style="font-weight: bold; color: #2c3e50;">${svc.Service_Name}</td><td style="text-align: center; color: #e74c3c; font-weight: bold; font-size: 16px;">${Number(giaTien).toLocaleString('vi-VN')} đ</td><td style="text-align: center;"><button onclick="suaGiaDichVu(${svc.Service_ID}, '${svc.Service_Name}', ${giaTien})" style="background: #f39c12; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold; margin-right: 5px;">Sửa Giá</button> <button onclick="xoaDichVu(${svc.Service_ID})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">Xóa</button></td></tr>`;
            });
        }
    } catch (error) { console.error('Lỗi load phí:', error); }
}

window.suaGiaDichVu = async function(id, name, oldPrice) {
    const newPrice = prompt(`Nhập đơn giá mới cho "${name}" (VNĐ):`, oldPrice);
    if (newPrice === null || newPrice === "") return; 
    try {
        const response = await fetch(`${API_BASE}/service/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ Price: newPrice }) });
        if (response.ok) { alert('Cập nhật thành công!'); loadServiceTypes(); }
    } catch (error) { console.error('Lỗi:', error); }
};

window.xoaDichVu = async function(id) {
    if (!confirm('Bạn có chắc muốn XÓA loại phí này?')) return;
    try {
        const response = await fetch(`${API_BASE}/service/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) { alert('Đã xóa!'); loadServiceTypes(); } else { alert('Lỗi: ' + (await response.json()).message); }
    } catch (error) { console.error('Lỗi:', error); }
};

let chartRevInstance = null;
let chartSvcInstance = null;

async function drawCharts() {
    try {
        const resInvoices = await fetch(`${API_BASE}/invoices`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (resInvoices.ok) {
            const invoices = await resInvoices.json();
            const revenueByMonth = {};
            invoices.forEach(inv => {
                if (inv.Payment_Status === 'Đã thanh toán') {
                    const label = `Tháng ${inv.Billing_Month}/${inv.Billing_Year}`;
                    revenueByMonth[label] = (revenueByMonth[label] || 0) + inv.Total_Amount;
                }
            });
            const canvasRev = document.getElementById('revenueChart');
            if(canvasRev) {
                if (chartRevInstance) chartRevInstance.destroy();
                chartRevInstance = new Chart(canvasRev, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(revenueByMonth).length > 0 ? Object.keys(revenueByMonth) : ['Chưa có dữ liệu'],
                        datasets: [{ label: 'Doanh thu (VNĐ)', data: Object.keys(revenueByMonth).length > 0 ? Object.values(revenueByMonth) : [0], backgroundColor: '#3498db', borderRadius: 4 }]
                    },
                    options: { responsive: true, plugins: { title: { display: true, text: '💰 DOANH THU THEO THÁNG', font: { size: 16 } } } }
                });
            }
        }

        const resServices = await fetch(`${API_BASE}/registered-services`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (resServices.ok) {
            const services = await resServices.json();
            const serviceCount = {};
            services.forEach(svc => { serviceCount[svc.Service_Name] = (serviceCount[svc.Service_Name] || 0) + svc.Quantity; });
            const canvasSvc = document.getElementById('serviceChart');
            if(canvasSvc) {
                if (chartSvcInstance) chartSvcInstance.destroy();
                chartSvcInstance = new Chart(canvasSvc, {
                    type: 'pie', 
                    data: {
                        labels: Object.keys(serviceCount).length > 0 ? Object.keys(serviceCount) : ['Chưa có dịch vụ'],
                        datasets: [{ data: Object.keys(serviceCount).length > 0 ? Object.values(serviceCount) : [1], backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e', '#e67e22'] }]
                    },
                    options: { responsive: true, plugins: { title: { display: true, text: '🚀 TỶ LỆ DỊCH VỤ SỬ DỤNG', font: { size: 16 } } } }
                });
            }
        }
    } catch (error) { console.error('Lỗi vẽ biểu đồ:', error); }
}

async function loadKPIs() {
    try {
        const [resInvoices, resHH, resDec, resSvc, resFac] = await Promise.all([
            fetch(`${API_BASE}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/households`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/declarations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/service-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/facility-bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resInvoices.ok) {
            const totalRev = (await resInvoices.json()).filter(i => i.Payment_Status === 'Đã thanh toán').reduce((sum, i) => sum + i.Total_Amount, 0);
            const elRev = document.getElementById('kpiRevenue');
            if(elRev) elRev.innerText = totalRev.toLocaleString('vi-VN') + ' đ';
        }

        if (resHH.ok) {
            const activeCount = (await resHH.json()).filter(h => h.Status === 'Đang ở').length;
            const elHH = document.getElementById('kpiHouseholds');
            if(elHH) elHH.innerText = activeCount;
        }
        
        let pendingCount = 0;
        if(resDec.ok) pendingCount += (await resDec.json()).length; 
        if(resSvc.ok) pendingCount += (await resSvc.json()).length; 
        if(resFac.ok) pendingCount += (await resFac.json()).length; 

        const elPending = document.getElementById('kpiPending');
        if(elPending) elPending.innerText = pendingCount;
    } catch (error) { console.error("Lỗi tải KPI:", error); }
}

// ==================================================
// 4. KÍCH HOẠT TẢI DỮ LIỆU KHI VỪA MỞ TRANG
// ==================================================
fetchAllInvoices();
fetchHouseholds(); 
fetchDeclarations();
fetchAllRegisteredServices();
fetchServiceRequests();
loadFacilityBookings();
loadFeedbacks();
loadServiceTypes();
drawCharts();
loadKPIs();