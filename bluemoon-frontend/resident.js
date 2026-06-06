// =========================================================================
// 1. KIỂM TRA BẢO MẬT KHI VỪA MỞ TRANG
// =========================================================================
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');
const API_BASE = 'http://localhost:5000/api/resident';

// Nếu không có Token hoặc không phải Resident -> Đuổi về trang đăng nhập
if (!token || role !== 'Resident') {
    alert('Bạn không có quyền truy cập trang này hoặc phiên đăng nhập đã hết hạn!');
    window.location.href = 'index.html';
}

// =========================================================================
// 2. HÀM LẤY DANH SÁCH HÓA ĐƠN
// =========================================================================
async function fetchInvoices() {
    try {
        const response = await fetch(`${API_BASE}/invoices`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const invoices = await response.json();
        const tbody = document.getElementById('invoiceTableBody');
        if (!tbody) return;
        tbody.innerHTML = ''; 

        if (response.ok) {
            if (invoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Bạn không có hóa đơn nào.</td></tr>';
            } else {
                invoices.forEach(inv => {
                    const statusColor = inv.Payment_Status === 'Chưa thanh toán' ? 'red' : 'green';
                    let actionHtml = '';
                    
                    // SỬA LỖI Ở ĐÂY: Truyền thêm tham số thứ 2 là inv.Total_Amount vào hàm
                    if (inv.Payment_Status === 'Chưa thanh toán') {
                        actionHtml = `<button onclick="thanhToanOnline(${inv.Invoice_ID}, ${inv.Total_Amount})" style="background:#3498db; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Thanh toán Online</button>`;
                    } else {
                        actionHtml = `<span style="color:#27ae60; font-weight:bold;">✅ Đã thanh toán</span>`;
                    }

                    tbody.innerHTML += `
                        <tr>
                            <td style="text-align: center;">${inv.Billing_Month}/${inv.Billing_Year}</td>
                            <td style="text-align: right; font-weight: bold; color: #e74c3c;">${inv.Total_Amount.toLocaleString('vi-VN')} đ</td>
                            <td style="text-align: center;">${actionHtml}</td>
                        </tr>
                    `;
                });
            }
        } else {
            alert('Lỗi tải hóa đơn: ' + invoices.message);
        }
    } catch (error) { console.error('Lỗi kết nối:', error); }
}

// =========================================================================
// XỬ LÝ THANH TOÁN QR ĐỘNG (VIETQR THẬT)
// =========================================================================
let currentPayingInvoiceId = null;

async function thanhToanOnline(invoiceId, totalAmount) {
    currentPayingInvoiceId = invoiceId;
    
    // THÔNG TIN TÀI KHOẢN NGÂN HÀNG CỦA BAN QUẢN LÝ
    const BANK_ID = 'MB';                   // Ngân hàng (Ví dụ: MB, VCB, TCB...)
    const ACCOUNT_NO = '03997886868';        // Số tài khoản nhận tiền
    const ACCOUNT_NAME = 'HO SY SON'; // Tên chủ tài khoản
    
    // Nội dung chuyển khoản tự động
    const CONTENT = `BLUEMOON TT HD ${invoiceId}`; 
    
    // Gọi API của VietQR để vẽ ảnh
    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${totalAmount}&addInfo=${encodeURIComponent(CONTENT)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    
    // Gắn dữ liệu vào Modal QR
    document.getElementById('qrInvoiceId').innerText = '#' + invoiceId;
    document.getElementById('qrAmount').innerText = totalAmount.toLocaleString('vi-VN');
    document.getElementById('imgQR').src = qrUrl;
    
    // Hiện bảng quét mã QR lên
    document.getElementById('modalQR').style.display = 'block';
}

function dongModalQR() {
    document.getElementById('modalQR').style.display = 'none';
}

async function xacNhanDaChuyenKhoan() {
    try {
        const response = await fetch(`${API_BASE}/invoice/${currentPayingInvoiceId}/pay`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('🎉 Hệ thống đã ghi nhận thanh toán thành công! BQL sẽ tiến hành đối soát hóa đơn của bạn.');
            dongModalQR();
            fetchInvoices(); // Làm mới bảng
        } else {
            const data = await response.json();
            alert('❌ Lỗi hệ thống: ' + data.message);
        }
    } catch (error) { console.error('Lỗi thanh toán:', error); }
}
// Hàm tải thông tin cá nhân để chào hỏi
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const greetingElement = document.getElementById('userGreeting');
            if (greetingElement) {
                // Hiển thị tên và tô màu nổi bật cho Số phòng
                greetingElement.innerHTML = `👋 Xin chào hộ dân phòng <span style="color: #f1c40f;">${data.Room_Number}</span> - ${data.Owner_Name}`;
            }
        }
    } catch (error) {
        console.error('Lỗi tải thông tin cá nhân:', error);
    }
}
// =========================================================================
// 3. XỬ LÝ GỬI FORM KHAI BÁO (ĐÃ CHUYỂN SANG API)
// =========================================================================
document.getElementById('declarationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // LƯU Ý: Frontend cần có 1 ô input (hoặc hidden) chứa Resident_ID của người đang được khai báo
    // Nếu bạn chưa có ô nhập Resident_ID trên HTML, hãy dùng prompt tạm hoặc tạo thêm ô input nhé.
    let residentId = document.getElementById('decResidentId') ? document.getElementById('decResidentId').value : prompt('Nhập ID Nhân khẩu cần khai báo (Số):');
    if (!residentId) return;

    const data = {
        Resident_ID: residentId,
        Declaration_Type: document.getElementById('decType').value,
        Start_Date: document.getElementById('startDate').value,
        End_Date: document.getElementById('endDate').value,
        Reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch(`${API_BASE}/declaration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok) {
            alert('🎉 ' + result.message);
            document.getElementById('declarationForm').reset();
        } else {
            alert('❌ Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi API:', error); }
});

// =========================================================================
// 4. MODULE: QUẢN LÝ DỊCH VỤ CỐ ĐỊNH (SERVICES)
// =========================================================================

// 4.1 Tải danh sách dịch vụ hiện có vào ô Select
async function fetchServices() {
    try {
        const response = await fetch(`${API_BASE}/services`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const services = await response.json();
        const select = document.getElementById('serviceSelect');
        if (!select) return;
        
        if (response.ok) {
            select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>'; 
            services.forEach(svc => {
                const option = document.createElement('option');
                option.value = svc.Service_ID;
                option.textContent = `${svc.Service_Name} (${svc.Unit_Price.toLocaleString('vi-VN')} đ/${svc.Calculation_Unit})`;
                select.appendChild(option);
            });
        }
    } catch (error) { console.error('Lỗi tải danh mục dịch vụ:', error); }
}

// 4.2 XỬ LÝ: Gửi form đăng ký dịch vụ
document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        Service_ID: document.getElementById('serviceSelect').value,
        Quantity: document.getElementById('serviceQuantity').value,
        Start_Date: document.getElementById('serviceStartDate').value
    };

    try {
        const response = await fetch(`${API_BASE}/service-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data) // Backend sẽ tự lấy Household_ID từ Token
        });

        const result = await response.json();
        if (response.ok) {
            alert('🎉 ' + result.message);
            document.getElementById('serviceForm').reset();
            fetchMyServices(); // Tải lại bảng ngay lập tức
        } else {
            alert('❌ Lỗi: ' + result.message);
        }
    } catch (error) { console.error('Lỗi:', error); }
});

// 4.3 HÀM: Tải danh sách dịch vụ ĐANG SỬ DỤNG (Đã thêm hiển thị Trạng thái)
async function fetchMyServices() {
    try {
        const response = await fetch(`${API_BASE}/my-services`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const services = await response.json();
        const tbody = document.getElementById('myServicesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (response.ok) {
            if (services.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Bạn chưa đăng ký dịch vụ nào.</td></tr>';
            } else {
                services.forEach(svc => {
                    const startDate = new Date(svc.Start_Date).toLocaleDateString('vi-VN');
                    
                    // Xử lý màu sắc cho Trạng thái
                    let statusColor = '#e67e22'; // Màu cam cho Chờ duyệt
                    if (svc.Status === 'Đã duyệt') statusColor = '#2ecc71'; // Màu xanh
                    if (svc.Status === 'Từ chối') statusColor = '#e74c3c'; // Màu đỏ

                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${svc.Service_Name}</strong></td>
                            <td style="text-align: center;">${svc.Quantity}</td>
                            <td style="text-align: center;">${startDate}</td>
                            <td style="text-align: right;">${svc.Unit_Price.toLocaleString('vi-VN')} đ</td>
                            <td style="text-align: center; font-weight: bold; color: ${statusColor};">${svc.Status || 'Chờ duyệt'}</td>
                        </tr>
                    `;
                });
            }
        }
    } catch (error) { console.error('Lỗi tải dịch vụ đang dùng:', error); }
}


// =========================================================================
// 5. XỬ LÝ ĐẶT LỊCH TIỆN ÍCH (FACILITY BOOKING)
// =========================================================================
const API_BOOKING_URL = 'http://localhost:5000/api/resident/facility-bookings';

// 5.1 Hàm load lịch sử đặt chỗ của hộ gia đình
async function loadMyBookings() {
    try {
        const response = await fetch(API_BOOKING_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const tbody = document.getElementById('bookingList');
        if (!tbody) return;
        
        if (response.ok) {
            const bookings = await response.json();
            tbody.innerHTML = ''; 
            
            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có lịch đặt tiện ích nào.</td></tr>';
                return;
            }

            bookings.forEach(b => {
                const dateOnly = b.Booking_Date.split('T')[0];
                let statusColor = 'orange';
                if (b.Status === 'Đã xác nhận' || b.Status === 'Approved') statusColor = 'green';
                if (b.Status === 'Từ chối' || b.Status === 'Rejected') statusColor = 'red';

                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 10px;">${b.Facility_Name}</td>
                        <td style="text-align:center;">${dateOnly}</td>
                        <td style="text-align:center;">${b.Time_Slot || (b.Start_Time + ' - ' + b.End_Time)}</td>
                        <td style="color: ${statusColor}; font-weight: bold; text-align:center;">${b.Status}</td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi khi load lịch sử đặt chỗ:', error); }
}

// 5.2 Bắt sự kiện khi cư dân bấm nút "Đặt lịch ngay"
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
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
                loadMyBookings(); 
            } else {
                alert('❌ Lỗi: ' + data.message); 
            }
        } catch (error) { console.error('Lỗi khi gửi yêu cầu:', error); }
    });
}

// =========================================================================
// HỆ THỐNG BONG BÓNG THÔNG BÁO (NOTIFICATIONS)
// =========================================================================
async function fetchAnnouncements() {
    try {
        const response = await fetch(`${API_BASE}/announcements`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!response.ok) return;
        
        const announcements = await response.json();
        const list = document.getElementById('announcementList');
        if(!list) return;
        
        list.innerHTML = '';
        
        if (announcements.length === 0) {
            list.innerHTML = '<p style="text-align:center; color: #7f8c8d;">Chưa có thông báo nào từ BQL.</p>';
        } else {
            announcements.forEach(ann => {
                const date = new Date(ann.Created_At).toLocaleString('vi-VN');
                list.innerHTML += `
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 5px 0; color: #2980b9;">${ann.Title}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${ann.Content}</p>
                        <small style="color: #95a5a6;">🕒 ${date}</small>
                    </div>
                `;
            });
        }

        // Logic Bong bóng đỏ
        const viewedCount = parseInt(localStorage.getItem('bluemoon_noti_viewed')) || 0;
        const badge = document.getElementById('notiBadge');
        
        if (announcements.length > viewedCount) {
            const unread = announcements.length - viewedCount;
            badge.textContent = unread;
            badge.style.display = 'inline-block'; // Hiện bong bóng đỏ
        } else {
            badge.style.display = 'none'; // Ẩn bong bóng
        }

        // Lưu tổng số thông báo vào biến môi trường để dùng khi bấm click
        window.totalAnnouncements = announcements.length;

    } catch (error) { console.error('Lỗi tải thông báo:', error); }
}

// Bắt sự kiện khi Cư dân bấm vào Chuông
const notiWrapper = document.getElementById('notificationWrapper');
if (notiWrapper) {
    notiWrapper.addEventListener('click', function() {
        const panel = document.getElementById('notificationPanel');
        
        // Bật / tắt bảng thông báo
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            
            // Xóa bong bóng đỏ và cập nhật bộ nhớ
            document.getElementById('notiBadge').style.display = 'none';
            localStorage.setItem('bluemoon_noti_viewed', window.totalAnnouncements);
        } else {
            panel.style.display = 'none';
        }
    });
}

// Gọi API tải thông báo ngay khi mở trang
fetchAnnouncements();

// =========================================================================
// 6. XỬ LÝ ĐĂNG XUẤT 
// =========================================================================
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    window.location.href = 'index.html';
});

// =========================================================================
// XỬ LÝ PHẢN ÁNH / GÓP Ý (CƯ DÂN)
// =========================================================================
const formFeedback = document.getElementById('formFeedback');
if (formFeedback) {
    formFeedback.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('fbTitle').value;
        const content = document.getElementById('fbContent').value;

        try {
            const response = await fetch(`${API_BASE}/feedbacks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, content })
            });
            const data = await response.json();
            if (response.ok) {
                alert('🎉 ' + data.message);
                formFeedback.reset();
                loadMyFeedbacks(); // Tải lại bảng ngay lập tức
            } else {
                alert('❌ Lỗi: ' + data.message);
            }
        } catch (error) { console.error('Lỗi khi gửi phản ánh:', error); }
    });
}

async function loadMyFeedbacks() {
    try {
        const response = await fetch(`${API_BASE}/feedbacks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tbody = document.getElementById('bangLichSuPhanAnh');
        if (!tbody) return;

        if (response.ok) {
            const feedbacks = await response.json();
            tbody.innerHTML = '';
            
            if (feedbacks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Bạn chưa gửi phản ánh nào.</td></tr>';
                return;
            }
            
            feedbacks.forEach(fb => {
                const date = new Date(fb.Created_At).toLocaleDateString('vi-VN');
                // Tự động đổi màu chữ theo trạng thái
                let color = fb.Status === 'Đã xử lý' ? '#27ae60' : (fb.Status === 'Đang xử lý' ? '#3498db' : '#f39c12');
                
                tbody.innerHTML += `
                    <tr>
                        <td style="text-align:center;">${date}</td>
                        <td><strong>${fb.Title}</strong></td>
                        <td>${fb.Content}</td>
                        <td style="color:${color}; font-weight:bold; text-align:center;">${fb.Status}</td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error('Lỗi load phản ánh:', error); }
}

// Bắt buộc gọi hàm này để nó tự chạy khi mở trang
loadMyFeedbacks();

// =========================================================================
// 7. KHỞI CHẠY CÁC HÀM TẢI DỮ LIỆU KHI MỞ TRANG
// =========================================================================
fetchInvoices();
fetchServices();
fetchMyServices();
loadMyBookings();
loadUserProfile();