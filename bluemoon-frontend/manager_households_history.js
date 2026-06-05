// 1. Kiểm tra đăng nhập
const token = localStorage.getItem('bluemoon_token');
if (!token) {
    alert('Vui lòng đăng nhập!');
    window.location.href = 'index.html';
}

const MANAGER_API_URL = 'http://localhost:5000/api/manager';

// 2. Tải danh sách lịch sử
async function fetchHistory() {
    try {
        const response = await fetch(`${MANAGER_API_URL}/households/history`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const historyList = await response.json();
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (historyList.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 15px;">Không có dữ liệu lịch sử.</td></tr>';
                return;
            }

            historyList.forEach(hh => {
                // Định dạng lại ngày tháng năm
                const moveInDate = new Date(hh.Move_In_Date).toLocaleDateString('vi-VN');
                
                const row = `
                    <tr>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${hh.Room_Number}</td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${hh.Owner_Name}</td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${moveInDate}</td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #c0392b; font-weight: bold;">${hh.Status}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error);
        document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="4" style="color: red; text-align: center;">Lỗi kết nối.</td></tr>';
    }
}

// Chạy hàm ngay khi load trang
fetchHistory();