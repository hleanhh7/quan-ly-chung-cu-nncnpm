// 1. KIỂM TRA BẢO MẬT (Chỉ Quản lý mới được vào)
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');

if (!token || role !== 'Manager') {
    alert('Truy cập bị từ chối. Chỉ dành cho Ban Quản Lý!');
    window.location.href = 'index.html';
}

// HÀM TIỆN ÍCH: Dùng để gọi API chung cho các form
async function callManagerApi(url, data, formId) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Quẹt thẻ
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Thành công: ' + result.message);
            document.getElementById(formId).reset(); // Xóa trắng form sau khi thành công
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        alert('Lỗi kết nối đến máy chủ!');
    }
}

// 2. XỬ LÝ FORM THÊM HỘ KHẨU (Có tự động tải lại bảng)
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Thành công: ' + result.message);
            document.getElementById('formHousehold').reset();
            fetchHouseholds(); // <-- GỌI LẠI HÀM NÀY ĐỂ BẢNG TỰ CẬP NHẬT HỘ MỚI!
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error(error);
    }
});

// 3. XỬ LÝ FORM THÊM NHÂN KHẨU
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

// 4. XỬ LÝ FORM TẠO HÓA ĐƠN
document.getElementById('formInvoice').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('invHouseholdId').value,
        Billing_Month: document.getElementById('invMonth').value,
        Billing_Year: document.getElementById('invYear').value,
        Total_Amount: document.getElementById('invTotal').value
    };
    fetchAllInvoices(); // Cập nhật lại bảng hóa đơn ngay sau khi tạo mới
    callManagerApi('http://localhost:5000/api/manager/invoice', data, 'formInvoice');
});


// 6. XỬ LÝ FORM TẠO TÀI KHOẢN CHO CƯ DÂN 
document.getElementById('formAccount').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        Household_ID: document.getElementById('accHouseholdId').value,
        Username: document.getElementById('accUsername').value,
        Password: document.getElementById('accPassword').value
    };
    callManagerApi('http://localhost:5000/api/manager/account', data, 'formAccount');
});

// 5. ĐĂNG XUẤT
document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('bluemoon_token');
    localStorage.removeItem('bluemoon_role');
    window.location.href = 'index.html';
});

// HÀM TẢI DANH SÁCH HỘ KHẨU
async function fetchHouseholds() {
    try {
        const response = await fetch('http://localhost:5000/api/manager/households', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Quẹt thẻ bảo vệ
            }
        });

        const households = await response.json();
        const tbody = document.getElementById('householdTableBody');
        tbody.innerHTML = ''; // Xóa dòng chữ "Đang tải..."

        if (response.ok) {
            if (households.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Chưa có hộ khẩu nào trong hệ thống.</td></tr>';
            } else {
                households.forEach(hh => {
                    // Chuyển định dạng ngày từ DB thành ngày/tháng/năm dễ nhìn
                    const moveInDate = new Date(hh.Move_In_Date).toLocaleDateString('vi-VN');
                    
                    // (Bên trong hàm fetchHouseholds, thay thế đoạn tạo const row cũ bằng đoạn này)
                    
                    // Nếu trạng thái là 'Đã chuyển đi', ta ẩn nút đi hoặc làm mờ nó
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
        } else {
            alert('Lỗi khi tải danh sách: ' + households.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
}

// Gọi hàm này ngay khi trang load xong
fetchHouseholds();


// HÀM: Tải danh sách đơn đang chờ duyệt
async function fetchDeclarations() {
    try {
        const response = await fetch('http://localhost:5000/api/manager/declarations', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const declarations = await response.json();
        const tbody = document.getElementById('declarationTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (declarations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có đơn nào đang chờ duyệt.</td></tr>';
            } else {
                declarations.forEach(dec => {
                    const startDate = new Date(dec.Start_Date).toLocaleDateString('vi-VN');
                    const endDate = new Date(dec.End_Date).toLocaleDateString('vi-VN');
                    const loai = dec.Declaration_Type === 'TamTru' ? 'Tạm trú' : 'Tạm vắng';

                    const row = `
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
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
}

// Gọi hàm ngay khi load trang
fetchDeclarations();



// HÀM: Tải danh sách toàn bộ hóa đơn
async function fetchAllInvoices() {
    try {
        const response = await fetch('http://localhost:5000/api/manager/invoices', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const invoices = await response.json();
        const tbody = document.getElementById('allInvoicesTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (invoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hóa đơn nào được tạo.</td></tr>';
            } else {
                invoices.forEach(inv => {
                    // Nếu chưa thanh toán thì hiện nút "Thu tiền", nếu đã thanh toán thì ẩn nút
                    const actionButton = inv.Payment_Status === 'Chưa thanh toán' 
                        ? `<button onclick="markInvoiceAsPaid(${inv.Invoice_ID})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Thu tiền</button>`
                        : `<span style="color: #27ae60; font-weight: bold;">Hoàn tất</span>`;

                    const statusColor = inv.Payment_Status === 'Chưa thanh toán' ? '#e74c3c' : '#27ae60';

                    const row = `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${inv.Room_Number}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${inv.Billing_Month}/${inv.Billing_Year}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${inv.Total_Amount.toLocaleString('vi-VN')} đ</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${inv.Payment_Status}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${actionButton}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (error) {
        console.error('Lỗi tải hóa đơn:', error);
    }
}

// Gọi hàm khi load trang
fetchAllInvoices();

// HÀM: Xác nhận thu tiền hóa đơn
window.markInvoiceAsPaid = async function(id) {
    if (!confirm('Xác nhận hộ dân này đã đóng tiền?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/manager/invoice/${id}/pay`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchAllInvoices(); // Cập nhật lại bảng hóa đơn
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
};

// HÀM: Gửi yêu cầu Duyệt hoặc Từ chối lên Server
// Lưu ý: Hàm này phải để ở global (biến toàn cục) để nút onclick trong HTML gọi được
window.updateDeclaration = async function(id, status) {
    if (!confirm(`Bạn có chắc muốn ${status.toLowerCase()} đơn này?`)) return;

    try {
        const response = await fetch(`http://localhost:5000/api/manager/declaration/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ Status: status })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchDeclarations(); // Tải lại bảng ngay lập tức để đơn đó biến mất khỏi danh sách chờ
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error(error);
    }
};

// HÀM: Đổi trạng thái hộ khẩu thành Đã chuyển đi
window.markAsMovedOut = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn báo hộ này đã chuyển đi? Tài khoản Web của họ sẽ bị thu hồi.')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/manager/household/${id}/status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchHouseholds(); // Cập nhật lại bảng
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
    }
};

// HÀM: Tải toàn bộ dịch vụ cư dân đang dùng
async function fetchAllRegisteredServices() {
    try {
        const response = await fetch('http://localhost:5000/api/manager/registered-services', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const services = await response.json();
        const tbody = document.getElementById('allServicesTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (services.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có hộ nào đăng ký dịch vụ.</td></tr>';
            } else {
                services.forEach(svc => {
                    const startDate = new Date(svc.Start_Date).toLocaleDateString('vi-VN');
                    const row = `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${svc.Room_Number}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${svc.Service_Name}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${svc.Quantity}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startDate}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #e67e22; font-weight: bold;">
                                ${svc.Estimated_Cost.toLocaleString('vi-VN')} đ
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (error) {
        console.error('Lỗi tải danh sách dịch vụ:', error);
    }
}

fetchAllRegisteredServices(); // Gọi hàm khi load trang