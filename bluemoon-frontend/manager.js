// 1. KIỂM TRA BẢO MẬT (Chỉ Quản lý mới được vào)
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');

if (!token || role !== 'Manager') {
    alert('Truy cập bị từ chối. Chỉ dành cho Ban Quản Lý!');
    window.location.href = 'index.html';
}

// ==================================================
// 2. MOCK DATA - KHỞI TẠO DỮ LIỆU MẪU
// ==================================================
if (!localStorage.getItem('households')) {
    localStorage.setItem('households', JSON.stringify([
        { Household_ID: 1, Room_Number: 'A1-101', Owner_Name: 'Nguyễn Văn An', Move_In_Date: '2023-03-15', Status: 'Đang ở' },
        { Household_ID: 2, Room_Number: 'B2-405', Owner_Name: 'Trần Thị Bình', Move_In_Date: '2022-07-01', Status: 'Đang ở' },
    ]));
}
if (!localStorage.getItem('invoices')) {
    localStorage.setItem('invoices', JSON.stringify([
        { Invoice_ID: 1, Room_Number: 'A1-101', Billing_Month: 5, Billing_Year: 2026, Total_Amount: 1250000, Payment_Status: 'Chưa thanh toán' },
        { Invoice_ID: 2, Room_Number: 'B2-405', Billing_Month: 5, Billing_Year: 2026, Total_Amount: 980000,  Payment_Status: 'Đã thanh toán' },
    ]));
}
if (!localStorage.getItem('registeredServices')) {
    localStorage.setItem('registeredServices', JSON.stringify([
        { Room_Number: 'A1-101', Service_Name: 'Gửi xe máy', Quantity: 1, Start_Date: '2025-01-15', Estimated_Cost: 200000 },
    ]));
}
if (!localStorage.getItem('declarations')) {
    localStorage.setItem('declarations', JSON.stringify([]));
}
if (!localStorage.getItem('serviceRequests')) {
    localStorage.setItem('serviceRequests', JSON.stringify([]));
}

// HÀM TIỆN ÍCH: Dùng để gọi API chung cho các form
async function callManagerApi(url, data, formId) {
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
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        alert('Lỗi kết nối đến máy chủ!');
    }
}

// ==================================================
// 3. XỬ LÝ CÁC FORM GỬI DỮ LIỆU
// ==================================================
document.getElementById('formHousehold').addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        Room_Number: document.getElementById('roomNumber').value,
        Owner_Name: document.getElementById('ownerName').value,
        Move_In_Date: document.getElementById('moveInDate').value
    };
    try {
        const response = await fetch('http://localhost:5000/api/manager/household', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert('Thành công: ' + result.message);
            document.getElementById('formHousehold').reset();
            fetchHouseholds(); 
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) { console.error(error); }
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
    callManagerApi('http://localhost:5000/api/manager/resident', data, 'formResident');
});

document.getElementById('formInvoice').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('invHouseholdId').value,
        Billing_Month: document.getElementById('invMonth').value,
        Billing_Year: document.getElementById('invYear').value,
        Total_Amount: document.getElementById('invTotal').value
    };
    callManagerApi('http://localhost:5000/api/manager/invoice', data, 'formInvoice');
    setTimeout(fetchAllInvoices, 500); // Tải lại bảng sau khi lưu
});

document.getElementById('formAccount').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('accHouseholdId').value,
        Username: document.getElementById('accUsername').value,
        Password: document.getElementById('accPassword').value
    };
    callManagerApi('http://localhost:5000/api/manager/account', data, 'formAccount');
});

document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    window.location.href = 'index.html';
});

// ==================================================
// 4. RENDER BẢNG VÀ CHỨC NĂNG (GIAO DIỆN)
// ==================================================

// --- QUẢN LÝ HÓA ĐƠN ---
async function fetchAllInvoices() {
    try {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const tbody = document.getElementById('allInvoicesTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hóa đơn nào được tạo.</td></tr>';
        } else {
            invoices.forEach(inv => {
                // Nút thu tiền gọi đúng hàm xacNhanThuTien
                const actionButton = inv.Payment_Status === 'Chưa thanh toán' 
                    ? `<button onclick="xacNhanThuTien(${inv.Invoice_ID})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Thu tiền</button>`
                    : `<span style="color: #27ae60; font-weight: bold;">Hoàn tất</span>`;

                const statusColor = inv.Payment_Status === 'Chưa thanh toán' ? '#e74c3c' : '#27ae60';

                const row = `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${inv.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${inv.Billing_Month}/${inv.Billing_Year}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${Number(inv.Total_Amount).toLocaleString('vi-VN')} đ</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${inv.Payment_Status}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    } catch (error) { console.error('Lỗi tải hóa đơn:', error); }
}

window.xacNhanThuTien = function(id) {
    if (!confirm('Xác nhận hộ dân này đã đóng tiền?')) return;

    // Lấy dữ liệu, thay đổi trạng thái và lưu đè lên lại
    let invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const idx = invoices.findIndex(inv => inv.Invoice_ID == id);
    
    if (idx !== -1) {
        invoices[idx].Payment_Status = 'Đã thanh toán';
        localStorage.setItem('invoices', JSON.stringify(invoices));
        
        // Gọi lại bảng để cập nhật màu chữ ngay lập tức
        fetchAllInvoices(); 
        alert('Xác nhận thu tiền thành công!');
    } else {
        alert('Lỗi: Không tìm thấy dữ liệu hóa đơn này.');
    }
};

// --- QUẢN LÝ HỘ KHẨU ---
async function fetchHouseholds() {
    try {
        const households = JSON.parse(localStorage.getItem('households') || '[]');
        const tbody = document.getElementById('householdTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (households.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có hộ khẩu nào.</td></tr>';
        } else {
            households.forEach(hh => {
                const moveInDate = new Date(hh.Move_In_Date).toLocaleDateString('vi-VN');
                const actionButton = hh.Status === 'Đang ở' 
                    ? `<button onclick="markAsMovedOut(${hh.Household_ID})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Báo chuyển đi</button>`
                    : `<span style="color: #7f8c8d; font-style: italic;">Đã rời đi</span>`;

                const row = `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad;">${hh.Household_ID}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hh.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${hh.Owner_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${hh.Status === 'Đang ở' ? '#2ecc71' : '#e74c3c'};">${hh.Status}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    } catch (error) { console.error('Lỗi kết nối:', error); }
}

window.markAsMovedOut = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn báo hộ này đã chuyển đi?')) return;
    const households = JSON.parse(localStorage.getItem('households') || '[]');
    const hh = households.find(h => h.Household_ID == id);
    if (hh) {
        hh.Status = 'Đã chuyển đi';
        localStorage.setItem('households', JSON.stringify(households));

        const lichSu = JSON.parse(localStorage.getItem('moveOutHistory') || '[]');
        lichSu.push({
            Household_ID: hh.Household_ID,
            Room_Number: hh.Room_Number,
            Owner_Name: hh.Owner_Name,
            Move_In_Date: hh.Move_In_Date,
            Move_Out_Date: new Date().toISOString()
        });
        localStorage.setItem('moveOutHistory', JSON.stringify(lichSu));
    }
    alert('Đã cập nhật trạng thái hộ khẩu!');
    fetchHouseholds();
    fetchMoveOutHistory();
};

function fetchMoveOutHistory() {
    const tbody = document.getElementById('moveOutHistoryBody');
    if (!tbody) return;
    const lichSu = JSON.parse(localStorage.getItem('moveOutHistory') || '[]');
    tbody.innerHTML = '';

    if (lichSu.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có hộ nào chuyển đi.</td></tr>';
        return;
    }
    lichSu.forEach(hh => {
        const moveIn  = new Date(hh.Move_In_Date).toLocaleDateString('vi-VN');
        const moveOut = new Date(hh.Move_Out_Date).toLocaleDateString('vi-VN');
        tbody.innerHTML += `
            <tr>
                <td style="padding:10px;border:1px solid #ddd;text-align:center;">${hh.Room_Number}</td>
                <td style="padding:10px;border:1px solid #ddd;">${hh.Owner_Name}</td>
                <td style="padding:10px;border:1px solid #ddd;text-align:center;">${moveIn}</td>
                <td style="padding:10px;border:1px solid #ddd;text-align:center;color:#e74c3c;font-weight:bold;">${moveOut}</td>
            </tr>
        `;
    });
}

// --- DỊCH VỤ VÀ TẠM TRÚ ---
async function fetchDeclarations() {
    try {
        const declarations = JSON.parse(localStorage.getItem('declarations') || '[]');
        const tbody = document.getElementById('declarationTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (declarations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có đơn nào đang chờ duyệt.</td></tr>';
        } else {
            declarations.forEach(dec => {
                const startDate = new Date(dec.Start_Date).toLocaleDateString('vi-VN');
                const endDate = new Date(dec.End_Date).toLocaleDateString('vi-VN');
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

async function fetchAllRegisteredServices() {
    try {
        const services = JSON.parse(localStorage.getItem('registeredServices') || '[]');
        const tbody = document.getElementById('allServicesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hộ nào đăng ký dịch vụ.</td></tr>';
        } else {
            services.forEach(svc => {
                const startDate = new Date(svc.Start_Date).toLocaleDateString('vi-VN');
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
        const requests = JSON.parse(localStorage.getItem('serviceRequests') || '[]'); 
        const pending = requests.filter(r => !r.Status || r.Status === 'Chờ duyệt');
        const tbody = document.getElementById('bangDuyetDichVu'); 
        if (!tbody) return;
        tbody.innerHTML = '';

        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có yêu cầu nào chờ duyệt.</td></tr>';
        } else {
            pending.forEach(req => {
                const sentDate = new Date(req.Created_At).toLocaleDateString('vi-VN');
                tbody.innerHTML += `
                    <tr id="req-${req.Request_ID}">
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${req.Request_ID}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${sentDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${req.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${req.Service_Name}</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; white-space: pre-line;">${req.Details}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;" class="trang-thai">
                            <span style="color: #e67e22; font-weight: bold;">Chờ duyệt</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;" class="hanh-dong">
                            <button onclick="handleServiceRequest(${req.Request_ID}, 'Đã duyệt')" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; margin-right: 5px;">Duyệt</button>
                            <button onclick="handleServiceRequest(${req.Request_ID}, 'Từ chối')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi tải yêu cầu dịch vụ:', error); }
}

window.handleServiceRequest = function(id, status) {
    let reason = "";
    if (status === 'Từ chối') {
        reason = prompt("Nhập lý do từ chối:");
        if (reason === null) return;
    }
    const requests = JSON.parse(localStorage.getItem('serviceRequests') || '[]');
    const idx = requests.findIndex(r => r.Request_ID == id);
    if (idx !== -1) {
        requests[idx].Status = status;
        requests[idx].Reason = reason;
        localStorage.setItem('serviceRequests', JSON.stringify(requests));
    }
    fetchServiceRequests(); // Load lại bảng để ẩn dòng đã duyệt
};

window.updateDeclaration = async function(id, status) {
    if (!confirm(`Bạn có chắc muốn ${status.toLowerCase()} đơn này?`)) return;
    // Bỏ qua Fetch API lỗi, trực tiếp xóa ở mock data hiển thị UI
    const declarations = JSON.parse(localStorage.getItem('declarations') || '[]');
    const newDecs = declarations.filter(d => d.Declaration_ID != id);
    localStorage.setItem('declarations', JSON.stringify(newDecs));
    
    alert(`Đã ${status.toLowerCase()} thành công!`);
    fetchDeclarations(); // Load lại bảng
};

// ==================================================
// 5. GỌI TẢI DỮ LIỆU KHI KHỞI ĐỘNG
// ==================================================
fetchAllInvoices();
fetchHouseholds();
fetchMoveOutHistory();
fetchDeclarations();
fetchAllRegisteredServices();
fetchServiceRequests();