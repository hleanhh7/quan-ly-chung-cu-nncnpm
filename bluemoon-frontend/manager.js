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
        const response = await fetch(`${API_BASE}/households`, { headers: { 'Authorization': `Bearer ${token}` } });
        const households = await response.json();
        
        const tbodyActive = document.getElementById('householdTableBody');
        const tbodyHistory = document.getElementById('moveOutHistoryBody');
        if(!tbodyActive || !tbodyHistory) return;
        
        tbodyActive.innerHTML = '';
        tbodyHistory.innerHTML = '';

        let hasActive = false;
        let hasHistory = false;

        households.forEach(hh => {
            const moveInDate = hh.Move_In_Date ? new Date(hh.Move_In_Date).toLocaleDateString('vi-VN') : '';

            if (hh.Status === 'Đang ở') {
                hasActive = true;
                const actionButton = `<button onclick="markAsMovedOut(${hh.Household_ID})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Báo chuyển đi</button>`;
                tbodyActive.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad;">${hh.Household_ID}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hh.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${hh.Owner_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2ecc71;">${hh.Status}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                    </tr>
                `;
            } else {
                hasHistory = true;
                tbodyHistory.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${hh.Room_Number}</td>
                        <td style="padding:10px; border:1px solid #ddd;">${hh.Owner_Name}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${moveInDate}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; color:#e74c3c; font-weight:bold;">Đã chuyển đi</td>
                    </tr>
                `;
            }
        });

        if (!hasActive) tbodyActive.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có hộ khẩu nào đang ở.</td></tr>';
        if (!hasHistory) tbodyHistory.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có hộ nào chuyển đi.</td></tr>';

    } catch (error) { console.error('Lỗi kết nối:', error); }
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

// =========================================================================
// XỬ LÝ DUYỆT ĐẶT LỊCH TIỆN ÍCH (BBQ, TENNIS, GYM)
// =========================================================================
async function loadFacilityBookings() {
    try {
        const response = await fetch(`${API_BASE}/facility-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tbody = document.getElementById('bangDuyetTienIch');
        if (!tbody) return;

        if (response.ok) {
            const bookings = await response.json();
            tbody.innerHTML = '';
            
            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: #7f8c8d;">Không có yêu cầu đặt lịch nào chờ duyệt.</td></tr>';
                return;
            }
            
            bookings.forEach(b => {
                const dateOnly = new Date(b.Booking_Date).toLocaleDateString('vi-VN');
                tbody.innerHTML += `
                    <tr>
                        <td style="text-align:center;">#${b.Booking_ID}</td>
                        <td style="text-align:center;"><strong>${b.Room_Number}</strong></td>
                        <td style="text-align:center;">${b.Facility_Name}</td>
                        <td style="text-align:center; color: #2980b9; font-weight: bold;">${dateOnly}</td>
                        <td style="text-align:center;">${b.Time_Slot}</td>
                        <td style="color: #f39c12; font-weight: bold; text-align:center;">${b.Status}</td>
                        <td style="text-align:center;">
                            <button onclick="xuLyDatLich(${b.Booking_ID}, 'Đã duyệt')" style="background: #27ae60; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold; margin-right: 5px;">Duyệt</button>
                            <button onclick="xuLyDatLich(${b.Booking_ID}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">Từ chối</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi load đặt lịch tiện ích:', error); }
}

async function xuLyDatLich(id, status) {
    if (!confirm(`Bạn chắc chắn muốn ${status.toUpperCase()} yêu cầu đặt lịch này?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/facility-booking/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ Status: status })
        });
        
        if (response.ok) {
            alert(`🎉 Đã ${status.toLowerCase()} thành công!`);
            loadFacilityBookings(); // Tải lại bảng ngay lập tức
        } else {
            const err = await response.json();
            alert('❌ Lỗi: ' + err.message);
        }
    } catch (error) { console.error('Lỗi duyệt đặt lịch:', error); }
}

// Bắt buộc gọi hàm này để nó tự động chạy khi mở trang
loadFacilityBookings();

// =========================================================================
// VŨ KHÍ BÍ MẬT: VẼ BIỂU ĐỒ THỐNG KÊ TỰ ĐỘNG BẰNG CHART.JS
// =========================================================================
async function drawCharts() {
    try {
        // 1. VẼ BIỂU ĐỒ CỘT: DOANH THU (Lọc các hóa đơn "Đã thanh toán")
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

            new Chart(document.getElementById('revenueChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(revenueByMonth).length > 0 ? Object.keys(revenueByMonth) : ['Chưa có dữ liệu'],
                    datasets: [{
                        label: 'Doanh thu thực tế (VNĐ)',
                        data: Object.keys(revenueByMonth).length > 0 ? Object.values(revenueByMonth) : [0],
                        backgroundColor: '#3498db',
                        borderRadius: 4
                    }]
                },
                options: { 
                    responsive: true, 
                    plugins: { title: { display: true, text: '💰 DOANH THU ĐÃ THU ĐƯỢC THEO THÁNG', font: { size: 16 } } } 
                }
            });
        }

        // 2. VẼ BIỂU ĐỒ TRÒN: TỶ LỆ DỊCH VỤ CƯ DÂN DÙNG NHIỀU NHẤT
        const resServices = await fetch(`${API_BASE}/registered-services`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (resServices.ok) {
            const services = await resServices.json();
            
            const serviceCount = {};
            services.forEach(svc => {
                serviceCount[svc.Service_Name] = (serviceCount[svc.Service_Name] || 0) + svc.Quantity;
            });

            new Chart(document.getElementById('serviceChart'), {
                type: 'pie', // Biểu đồ bánh tròn
                data: {
                    labels: Object.keys(serviceCount).length > 0 ? Object.keys(serviceCount) : ['Chưa có dịch vụ'],
                    datasets: [{
                        data: Object.keys(serviceCount).length > 0 ? Object.values(serviceCount) : [1],
                        backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e', '#e67e22']
                    }]
                },
                options: { 
                    responsive: true, 
                    plugins: { title: { display: true, text: '🚀 TỶ LỆ CÁC DỊCH VỤ ĐANG ĐƯỢC SỬ DỤNG', font: { size: 16 } } } 
                }
            });
        }
    } catch (error) { console.error('Lỗi vẽ biểu đồ:', error); }
}

// Chạy hàm vẽ biểu đồ ngay khi mở trang
drawCharts();

// ==================================================
// 4. KÍCH HOẠT TẢI DỮ LIỆU KHI VỪA MỞ TRANG
// ==================================================
fetchAllInvoices();
fetchHouseholds(); 
fetchDeclarations();
fetchAllRegisteredServices();
fetchServiceRequests();