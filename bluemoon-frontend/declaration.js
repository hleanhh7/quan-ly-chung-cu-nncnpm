// 1. KIỂM TRA BẢO MẬT ĐẦU TRANG
const token = localStorage.getItem('bluemoon_token');
const role = localStorage.getItem('bluemoon_role');

if (!token || role !== 'Resident') {
    alert('Bạn không có quyền truy cập hoặc phiên làm việc đã hết hạn!');
    window.location.href = 'index.html';
}

// 2. XỬ LÝ GỬI FORM KHAI BÁO LÊN BACKEND
document.getElementById('declarationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

const data = {
    Identity_Card: document.getElementById('decIdentity').value, // Sửa dòng này
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
            alert('🎉 Gửi khai báo thành công! Đang chờ Ban quản lý phê duyệt.');
            window.location.href = 'resident_dashboard.html'; // Chuyển hướng về trang chủ sau khi xong
        } else {
            alert('❌ Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Không thể kết nối đến máy chủ!');
    }
});