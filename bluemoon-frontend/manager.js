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
            Move_In_Date: document.getElementById('moveInDate').value,
            // Gom thêm 2 thông tin tài khoản
            Username: document.getElementById('accUsername').value,
            Password: document.getElementById('accPassword').value
        };
        // Vẫn gọi vào API cũ, Backend sẽ lo phần còn lại
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
            
            // Lấy kết quả từ Backend ra trước
            const result = await response.json(); 
            
            if (response.ok) {
                alert('🎉 ' + result.message);
                formAddServiceType.reset();
                loadServiceTypes();
            } else {
                // VŨ KHÍ BÍ MẬT: Phải có dòng này để nó hiện lỗi đỏ chót ra màn hình
                alert('❌ Lỗi từ hệ thống: ' + result.message); 
            }
        } catch (error) { 
            console.error('Lỗi thêm phí:', error); 
            alert('❌ Lỗi kết nối đến máy chủ!');
        }
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

// =======================================================================
// QUẢN LÝ HÓA ĐƠN (Gom nhóm theo phòng & Popup Chi Tiết)
// =======================================================================

window.khoHoaDonTam = []; // Kho lưu dữ liệu gốc để Modal dùng
window.phongHoaDonDangMo = null; // Ghi nhớ xem Modal nào đang mở để tự động refresh

async function fetchAllInvoices() {
    try {
        const response = await fetch(`${API_BASE}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
        let invoices = await response.json();
        const tbody = document.getElementById('allInvoicesTableBody');
        if(!tbody) return;

        window.khoHoaDonTam = invoices;
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hóa đơn nào.</td></tr>';
            return;
        }

        // 1. THUẬT TOÁN GOM NHÓM TỔNG NỢ THEO SỐ PHÒNG
        const groupedInvoices = {};
        invoices.forEach(inv => {
            const room = inv.Room_Number;
            if (!groupedInvoices[room]) {
                groupedInvoices[room] = { totalInvoices: 0, unpaidCount: 0, totalDebt: 0 };
            }
            groupedInvoices[room].totalInvoices += 1;
            
            // Nếu chưa thanh toán thì đếm số lượng và cộng dồn tiền nợ
            if (inv.Payment_Status === 'Chưa thanh toán') {
                groupedInvoices[room].unpaidCount += 1;
                groupedInvoices[room].totalDebt += (inv.Total_Amount || 0);
            }
        });

        // 2. VẼ RA BẢNG TỔNG HỢP Ở NGOÀI MÀN HÌNH CHÍNH
        Object.keys(groupedInvoices)
            .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
            .forEach(room => {
                const data = groupedInvoices[room];
                
                // Tô màu đỏ nếu có nợ, màu xanh nếu đã đóng đủ
                const textNo = data.totalDebt > 0 ? `<span style="color:#e74c3c; font-weight:bold;">${Number(data.totalDebt).toLocaleString('vi-VN')} đ</span>` : `<span style="color:#27ae60; font-weight:bold;">0 đ</span>`;
                const textSlChuaDong = data.unpaidCount > 0 ? `<span style="color:#e74c3c; font-weight:bold;">${data.unpaidCount} hóa đơn</span>` : `<span style="color:#27ae60;">Đã đóng đủ</span>`;

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #27ae60; font-size: 16px;">${room}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.totalInvoices}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${textSlChuaDong}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${textNo}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            <button onclick="moModalHoaDon('${room}')" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">🧾 Xem Chi Tiết</button>
                        </td>
                    </tr>
                `;
            });

        // NẾU MODAL ĐANG MỞ (Vừa thu tiền xong), ÉP MODAL VẼ LẠI NGAY LẬP TỨC
        if (window.phongHoaDonDangMo) {
            moModalHoaDon(window.phongHoaDonDangMo);
        }

    } catch (error) { console.error('Lỗi tải hóa đơn:', error); }
}

// 3. HÀM MỞ MODAL VÀ LỌC CÁC HÓA ĐƠN CỦA PHÒNG (Đã nâng cấp để nhận thêm Tháng/Năm)
window.moModalHoaDon = function(roomNumber, filterMonth = '', filterYear = '') {
    window.phongHoaDonDangMo = roomNumber; // Lưu lại trạng thái đang mở
    document.getElementById('mhd_roomNumber').innerText = roomNumber;
    const tbody = document.getElementById('mhd_tbody');
    tbody.innerHTML = '';

    // Lấy hóa đơn của phòng này
    let hdPhong = window.khoHoaDonTam.filter(inv => inv.Room_Number == roomNumber);

    // 🚀 BỘ LỌC THÔNG MINH: Cắt bớt dữ liệu nếu Admin có gõ vào ô tìm kiếm
    if (filterMonth) hdPhong = hdPhong.filter(inv => inv.Billing_Month == filterMonth);
    if (filterYear) hdPhong = hdPhong.filter(inv => inv.Billing_Year == filterYear);

    // Xếp từ tháng mới nhất xuống cũ nhất
    hdPhong.sort((a, b) => {
        if (b.Billing_Year !== a.Billing_Year) return b.Billing_Year - a.Billing_Year;
        return b.Billing_Month - a.Billing_Month;
    });

    // Nếu lọc xong mà rỗng (không tìm thấy)
    if (hdPhong.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:#e74c3c; font-weight:bold;">❌ Không tìm thấy hóa đơn nào khớp với thời gian này!</td></tr>';
        document.getElementById('modalHoaDon').style.display = 'block';
        return;
    }

    // Vẽ bảng nếu có dữ liệu
    hdPhong.forEach(inv => {
        const statusDropdown = `
            <select id="status-select-${inv.Invoice_ID}" onchange="changeInvoiceStatus(${inv.Invoice_ID}, this)" 
                    style="padding: 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold; cursor: pointer;
                           background-color: ${inv.Payment_Status === 'Đã thanh toán' ? '#d4edda' : '#f8d7da'}; 
                           color: ${inv.Payment_Status === 'Đã thanh toán' ? '#155724' : '#721c24'};">
                <option value="Chưa thanh toán" ${inv.Payment_Status === 'Chưa thanh toán' ? 'selected' : ''}>Chưa thanh toán</option>
                <option value="Đã thanh toán" ${inv.Payment_Status === 'Đã thanh toán' ? 'selected' : ''}>Đã thanh toán</option>
            </select>
        `;

        const actionButton = inv.Payment_Status === 'Chưa thanh toán' 
            ? `<button onclick="moModalThuTien(${inv.Invoice_ID}, ${inv.Total_Amount})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Thu tiền</button>`
            : `<span style="color: #27ae60; font-weight: bold;">Hoàn tất</span>`;
        
        tbody.innerHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight:bold;">${inv.Billing_Month}/${inv.Billing_Year}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color:#c0392b; font-weight:bold;">${Number(inv.Total_Amount).toLocaleString('vi-VN')} đ</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${statusDropdown}</td>
                <td id="action-cell-${inv.Invoice_ID}" style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
            </tr>
        `;
    });

    document.getElementById('modalHoaDon').style.display = 'block';
};

// 4. HÀM XỬ LÝ NÚT BẤM "TÌM KIẾM" VÀ "BỎ LỌC"
window.locHoaDonTrongModal = function() {
    const m = document.getElementById('filterMonth').value;
    const y = document.getElementById('filterYear').value;
    // Tái sử dụng lại hàm mở Modal nhưng nhét thêm "Đạn" (Tháng và Năm) vào
    moModalHoaDon(window.phongHoaDonDangMo, m, y);
};

window.boLocHoaDon = function() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    // Mở lại trần trụi (Không có đạn) để hiện toàn bộ
    moModalHoaDon(window.phongHoaDonDangMo);
};

// 5. HÀM ĐÓNG MODAL (Sạch sẽ ô tìm kiếm cho lần mở sau)
window.dongModalHoaDon = function() {
    window.phongHoaDonDangMo = null; 
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('modalHoaDon').style.display = 'none';
};
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

// --- QUẢN LÝ HỘ KHẨU & LỊCH SỬ CHUYỂN ĐI ---
async function fetchHouseholds() {
    try {
        const response = await fetch(`${API_BASE}/households`, { headers: { 'Authorization': `Bearer ${token}` } });
        const households = await response.json();
        households.sort((a, b) => String(a.Room_Number).localeCompare(String(b.Room_Number), undefined, { numeric: true }));
        const tbodyActive = document.getElementById('householdTableBody');
        const tbodyHistory = document.getElementById('moveOutHistoryBody');
        if(!tbodyActive || !tbodyHistory) return;
        
        tbodyActive.innerHTML = '';
        tbodyHistory.innerHTML = '';

        let hasActive = false;
        let hasHistory = false;
        // 1. TẠO BIẾN ĐẾM SỐ PHÒNG
        let activeRoomCount = 0;

        households.forEach(hh => {
            const moveInDate = hh.Move_In_Date ? new Date(hh.Move_In_Date).toLocaleDateString('vi-VN') : '';

            if (hh.Status === 'Đang ở') {
                hasActive = true;
                activeRoomCount++;
                
                // 2 nút của bảng Hộ khẩu đang ở
                const btnXem = `<button onclick="xemNhanKhau(${hh.Household_ID}, '${hh.Room_Number}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold;">👁️ Xem</button>`;
                const btnBaoChuyen = `<button onclick="markAsMovedOut(${hh.Household_ID})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Báo chuyển đi</button>`;
                
                tbodyActive.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad;">${hh.Household_ID}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hh.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${hh.Owner_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2ecc71;">${hh.Status}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${btnXem}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${btnBaoChuyen}</td>
                    </tr>
                `;
            } else {
                hasHistory = true;
                
                // Nút của bảng Lịch sử
                const btnXemLichSu = `<button onclick="xemNhanKhau(${hh.Household_ID}, '${hh.Room_Number}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold;">👁️ Xem</button>`;

                tbodyHistory.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${hh.Room_Number}</td>
                        <td style="padding:10px; border:1px solid #ddd;">${hh.Owner_Name}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${moveInDate}</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; color:#e74c3c; font-weight:bold;">Đã chuyển đi</td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">${btnXemLichSu}</td>
                    </tr>
                `;
            }
        });

        if (!hasActive) tbodyActive.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có hộ khẩu nào đang ở.</td></tr>';
        if (!hasHistory) tbodyHistory.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hộ nào chuyển đi.</td></tr>';

        // 3. IN KẾT QUẢ ĐẾM ĐƯỢC LÊN GIAO DIỆN HEADER
        const headerCounter = document.getElementById('headerRoomCount');
        if (headerCounter) {
            headerCounter.innerText = activeRoomCount;
        }

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
                
                // CHÈN NÚT BUTTON LỊCH SỬ VÀO ĐÂY (Truyền số phòng dec.Room_Number vào hàm moModalLichSuKhaiBao)
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${dec.Room_Number}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${dec.Full_Name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${loai}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${start} - ${end}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${dec.Reason}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            <button onclick="updateDeclaration(${dec.Declaration_ID}, 'Đã duyệt')" style="background-color: #2ecc71; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Duyệt</button> 
                            <button onclick="updateDeclaration(${dec.Declaration_ID}, 'Từ chối')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Từ chối</button>
                            <button onclick="moModalLichSuKhaiBao('${dec.Room_Number}')" style="background-color: #16a085; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: bold; margin-left: 5px;">📜 Lịch sử</button>
                        </td>
                    </tr>`;
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

// =====================================================================
// BỔ SUNG THÊM: HÀM MỞ VÀ TẢI LỊCH SỬ KHAI BÁO CỦA PHÒNG LÊN POPUP MODAL
// =====================================================================
async function moModalLichSuKhaiBao(roomNumber) {
    document.getElementById('historyRoomTitle').innerText = roomNumber;
    document.getElementById('modalDeclarationHistory').style.display = 'block';
    
    const tbody = document.getElementById('historyDeclarationTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 15px;">Đang tải dữ liệu...</td></tr>';

    try {
        // Gọi API bóc tách lịch sử theo số phòng
        const response = await fetch(`${API_BASE}/declarations/history/${roomNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể lấy lịch sử');
        const list = await response.json();

        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 15px; color: #7f8c8d;">Phòng này chưa có dữ liệu lịch sử khai báo.</td></tr>';
            return;
        }

        list.forEach(item => {
            // Đổ dữ liệu tình trạng kèm nhãn màu
            let statusBadge = '';
            if (item.Status === 'Đã duyệt') {
                statusBadge = `<span style="color: #27ae60; background: #d4edda; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Đã duyệt</span>`;
            } else if (item.Status === 'Từ chối') {
                statusBadge = `<span style="color: #c0392b; background: #f8d7da; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Từ chối</span>`;
            } else {
                statusBadge = `<span style="color: #f39c12; background: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Chờ xử lý</span>`;
            }

            const tuNgay = item.Start_Date ? new Date(item.Start_Date).toLocaleDateString('vi-VN') : '...';
            const denNgay = item.End_Date ? new Date(item.End_Date).toLocaleDateString('vi-VN') : '...';
            const loaiDon = item.Declaration_Type === 'TamTru' ? 'Tạm trú' : 'Tạm vắng';

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; text-align: center; font-weight: bold; color: #2980b9;">${loaiDon}</td>
                    <td style="padding: 12px; text-align: left;">${item.Full_Name}</td>
                    <td style="padding: 12px; text-align: center; font-size: 13px;">${tuNgay} ➔ ${denNgay}</td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c; padding: 15px;">Không kết nối được API máy chủ lịch sử!</td></tr>';
    }
}

// BỔ SUNG THÊM: HÀM ĐÓNG CỬA SỔ POPUP MODAL
function dongModalLichSuKhaiBao() {
    document.getElementById('modalDeclarationHistory').style.display = 'none';
}

// =======================================================================
// QUẢN LÝ DỊCH VỤ (Gom nhóm theo phòng & Xem chi tiết)
// =======================================================================

// Biến toàn cục để lưu kho dữ liệu tạm thời
window.khoDichVuTam = [];

async function fetchAllRegisteredServices() {
    try {
        const response = await fetch(`${API_BASE}/registered-services`, { headers: { 'Authorization': `Bearer ${token}` } });
        const services = await response.json();
        const tbody = document.getElementById('allServicesTableBody');
        if (!tbody) return;

        // Lưu dữ liệu nguyên bản vào kho để lát nữa Modal lấy ra dùng
        window.khoDichVuTam = services;
        tbody.innerHTML = '';

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có dịch vụ đăng ký.</td></tr>';
        } else {
            // 1. THUẬT TOÁN GOM NHÓM THEO SỐ PHÒNG
            const groupedServices = {};
            services.forEach(svc => {
                const room = svc.Room_Number;
                if (!groupedServices[room]) {
                    groupedServices[room] = { totalTypes: 0, totalCost: 0 };
                }
                groupedServices[room].totalTypes += 1;
                groupedServices[room].totalCost += (svc.Estimated_Cost || 0);
            });

            // 2. VẼ RA BẢNG TỔNG HỢP GỌN GÀNG (Kết hợp luôn cả Sort tăng dần nhé)
            Object.keys(groupedServices)
                .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
                .forEach(room => {
                    const data = groupedServices[room];
                    tbody.innerHTML += `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #8e44ad; font-size: 16px;">${room}</td>
                            
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${data.totalTypes} loại dịch vụ</td>
                            
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #e67e22; font-weight: bold;">${Number(data.totalCost).toLocaleString('vi-VN')} đ</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                <button onclick="moModalDichVu('${room}')" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">👁️ Xem Danh Sách</button>
                            </td>
                        </tr>
                    `;
                });
        }
    } catch (error) { console.error('Lỗi tải danh sách dịch vụ:', error); }
}

// 3. HÀM MỞ MODAL VÀ LỌC DỮ LIỆU
window.moModalDichVu = function(roomNumber) {
    document.getElementById('mdv_roomNumber').innerText = roomNumber;
    const tbody = document.getElementById('mdv_tbody');
    tbody.innerHTML = '';

    // Lọc ra các dịch vụ thuộc đúng cái phòng vừa click
    const dichVuCuaPhong = window.khoDichVuTam.filter(svc => svc.Room_Number == roomNumber);

    dichVuCuaPhong.forEach(svc => {
        const startDate = svc.Start_Date ? new Date(svc.Start_Date).toLocaleDateString('vi-VN') : '';
        tbody.innerHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #2c3e50;">${svc.Service_Name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${svc.Quantity || 1}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startDate}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #c0392b; font-weight: bold;">${Number(svc.Estimated_Cost).toLocaleString('vi-VN')} đ</td>
            </tr>
        `;
    });

    // Hiển thị Modal
    document.getElementById('modalDichVu').style.display = 'block';
};

// 4. HÀM ĐÓNG MODAL
window.dongModalDichVu = function() {
    document.getElementById('modalDichVu').style.display = 'none';
};

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

window.xemNhanKhau = async function(id, room) {
    document.getElementById('mk_roomNumber').innerText = 'Phòng ' + room;
    const tbody = document.getElementById('mk_tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Đang tải dữ liệu...</td></tr>';
    document.getElementById('modalNhanKhau').style.display = 'block'; 

    try {
        const response = await fetch(`${API_BASE}/household/${id}/residents`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (response.ok) {
            const members = await response.json();
            tbody.innerHTML = '';
            
            if (members.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#e74c3c;">Phòng này chưa khai báo nhân khẩu nào.</td></tr>';
            } else {
                members.forEach(m => {
                    const dob = new Date(m.Date_Of_Birth).toLocaleDateString('vi-VN');
                    tbody.innerHTML += `
                        <tr>
                            <td style="font-weight: bold; padding: 10px; border: 1px solid #eee;">${m.Full_Name}</td>
                            <td style="text-align: center; padding: 10px; border: 1px solid #eee;">${dob}</td>
                            <td style="text-align: center; color: #e67e22; font-weight: bold; padding: 10px; border: 1px solid #eee;">${m.Relation_With_Owner}</td>
                        </tr>
                    `;
                });
            }
        }
    } catch (error) { console.error('Lỗi tải nhân khẩu:', error); }
};

window.dongModalNhanKhau = function() {
    document.getElementById('modalNhanKhau').style.display = 'none';
};

// =======================================================================
// HÀM: CẬP NHẬT TRẠNG THÁI HÓA ĐƠN (Gắn vào Window để HTML có thể gọi được)
// =======================================================================
window.changeInvoiceStatus = async function(invoiceId, selectElement) {
    const newStatus = selectElement.value;
    const token = localStorage.getItem('bluemoon_token');

    // 1. CHUYỂN MÀU GIAO DIỆN NGAY LẬP TỨC 
    if (newStatus === 'Chưa thanh toán') {
        selectElement.style.backgroundColor = '#f8d7da'; // Nền đỏ
        selectElement.style.color = '#721c24';
    } else {
        selectElement.style.backgroundColor = '#d4edda'; // Nền xanh
        selectElement.style.color = '#155724';
    }

    // 2. NẾU LÀ HOÀN TÁC VỀ "CHƯA THANH TOÁN", CẦN XÁC NHẬN CẨN THẬN
    if (newStatus === 'Chưa thanh toán') {
        const confirmRevert = confirm(`⚠️ CẢNH BÁO: Bạn đang muốn hoàn tác hóa đơn #${invoiceId} về trạng thái CHƯA THANH TOÁN. Bạn có chắc chắn không?`);
        
        // Nếu Admin bấm Cancel (Hủy), ta trả lại màu và trạng thái như cũ
        if (!confirmRevert) {
            selectElement.value = 'Đã thanh toán';
            selectElement.style.backgroundColor = '#d4edda';
            selectElement.style.color = '#155724';
            return; // Dừng luôn, không gọi API nữa
        }
    }

    // 3. GỬI LỆNH XUỐNG BACKEND DATABASE
    try {
        // Lưu ý: Đảm bảo đường dẫn API này khớp với Backend của nhóm bạn
        const response = await fetch(`${API_BASE}/invoice/${invoiceId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ Payment_Status: newStatus })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`🎉 Đã cập nhật hóa đơn #${invoiceId} thành: ${newStatus}`);
            // Có thể gọi lại hàm vẽ bảng ở đây nếu muốn nút [Thu tiền] hiện lại
            if(typeof fetchAllInvoices === 'function') fetchAllInvoices();
        } else {
            alert('❌ Lỗi cập nhật: ' + result.message);
            // Nếu lỗi, phải ép ô Dropdown quay về trạng thái cũ
            selectElement.value = newStatus === 'Chưa thanh toán' ? 'Đã thanh toán' : 'Chưa thanh toán';
        }
    } catch (error) {
        console.error("🔥 LỖI FRONTEND:", error);
        alert('❌ Không thể kết nối tới Server!');
    }
};

// =====================================================================
// TÍNH NĂNG MỚI: MỞ CỬA SỔ XEM LỊCH SỬ KHAI BÁO CỦA HỘ DÂN
// =====================================================================
async function moModalLichSuKhaiBao(roomNumber) {
    document.getElementById('historyRoomTitle').innerText = roomNumber;
    document.getElementById('modalDeclarationHistory').style.display = 'block';
    
    const tbody = document.getElementById('historyDeclarationTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 15px;">Đang tải dữ liệu...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/declarations/history/${roomNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể lấy lịch sử');
        const list = await response.json();

        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #7f8c8d;">Hộ gia đình này chưa có lịch sử khai báo nào.</td></tr>';
            return;
        }

        list.forEach(item => {
            // Định dạng trạng thái Đã duyệt / Từ chối / Chờ xử lý kèm màu sắc tương ứng
            let statusBadge = '';
            if (item.Status === 'Đã duyệt' || item.status === 'Approved') {
                statusBadge = `<span style="color: #27ae60; background: #d4edda; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Đã duyệt</span>`;
            } else if (item.Status === 'Từ chối' || item.status === 'Rejected') {
                statusBadge = `<span style="color: #c0392b; background: #f8d7da; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Từ chối</span>`;
            } else {
                statusBadge = `<span style="color: #f39c12; background: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Chờ xử lý</span>`;
            }

            // Định dạng ngày hiển thị (cắt chuỗi lấy phần yyyy-mm-dd)
            const tuNgay = item.Start_Date ? item.Start_Date.substring(0, 10) : '...';
            const denNgay = item.End_Date ? item.End_Date.substring(0, 10) : '...';

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; text-align: center; font-weight: bold; color: #2980b9;">${item.Declaration_Type}</td>
                    <td style="padding: 12px; text-align: left;">${item.Full_Name}</td>
                    <td style="padding: 12px; text-align: center; font-size: 13px;">${tuNgay} ➔ ${denNgay}</td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error('Lỗi tải lịch sử khai báo:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c; padding: 15px;">Lỗi kết nối máy chủ không thể tải dữ liệu!</td></tr>';
    }
}

// HÀM ĐÓNG CỬA SỔ POPUP
function dongModalLichSuKhaiBao() {
    document.getElementById('modalDeclarationHistory').style.display = 'none';
}

// =====================================================================
// 1. HÀM MỞ LỊCH SỬ CỦA RIÊNG 1 PHÒNG (Nút ở từng dòng)
// =====================================================================
async function moModalLichSuKhaiBao(roomNumber) {
    document.getElementById('historyRoomTitle').innerText = "Phòng " + roomNumber;
    document.getElementById('historyRoomTitle').style.color = "#e67e22";
    document.getElementById('modalDeclarationHistory').style.display = 'block';
    
    // Gọi API lấy dữ liệu của 1 phòng
    taiDuLieuLichSuKhaiBao(`${API_BASE}/declarations/history/${roomNumber}`);
}

// =====================================================================
// 2. HÀM MỞ LỊCH SỬ TỔNG TOÀN BỘ CHUNG CƯ (Nút xanh trên cùng)
// =====================================================================
async function moModalTongLichSuKhaiBao() {
    document.getElementById('historyRoomTitle').innerText = "Toàn Bộ Chung Cư";
    document.getElementById('historyRoomTitle').style.color = "#e74c3c";
    document.getElementById('modalDeclarationHistory').style.display = 'block';
    
    // Gọi API lấy dữ liệu tất cả các phòng
    taiDuLieuLichSuKhaiBao(`${API_BASE}/declarations/all-history`);
}

// =====================================================================
// 3. HÀM XỬ LÝ CHUNG: FETCH DỮ LIỆU VÀ ĐỔ VÀO BẢNG
// =====================================================================
async function taiDuLieuLichSuKhaiBao(apiUrl) {
    const tbody = document.getElementById('historyDeclarationTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 15px;">Đang tải dữ liệu...</td></tr>';

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể kết nối API');
        const list = await response.json();

        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 15px; color: #7f8c8d;">Chưa có dữ liệu lịch sử khai báo.</td></tr>';
            return;
        }

        list.forEach(item => {
            // Định dạng màu sắc trạng thái
            let statusBadge = '';
            if (item.Status === 'Đã duyệt') {
                statusBadge = `<span style="color: #27ae60; background: #d4edda; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Đã duyệt</span>`;
            } else if (item.Status === 'Từ chối') {
                statusBadge = `<span style="color: #c0392b; background: #f8d7da; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Từ chối</span>`;
            } else {
                statusBadge = `<span style="color: #f39c12; background: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Chờ xử lý</span>`;
            }

            const tuNgay = item.Start_Date ? new Date(item.Start_Date).toLocaleDateString('vi-VN') : '...';
            const denNgay = item.End_Date ? new Date(item.End_Date).toLocaleDateString('vi-VN') : '...';
            const loaiDon = item.Declaration_Type === 'TamTru' ? 'Tạm trú' : 'Tạm vắng';

            // In dòng dữ liệu
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; text-align: center; font-weight: bold; color: #e67e22;">${item.Room_Number}</td>
                    <td style="padding: 12px; text-align: center; font-weight: bold; color: #2980b9;">${loaiDon}</td>
                    <td style="padding: 12px; text-align: left;">${item.Full_Name}</td>
                    <td style="padding: 12px; text-align: center; font-size: 13px;">${tuNgay} ➔ ${denNgay}</td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #e74c3c; padding: 15px;">Lỗi máy chủ: Vui lòng bật lại Backend (npm run dev)!</td></tr>';
    }
}

// HÀM ĐÓNG POPUP MODAL
function dongModalLichSuKhaiBao() {
    document.getElementById('modalDeclarationHistory').style.display = 'none';
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