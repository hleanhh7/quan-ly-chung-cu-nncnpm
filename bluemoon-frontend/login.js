document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.innerText = '';

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Username: usernameInput,
                Password: passwordInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Đăng nhập thành công!');
            
            // 1. Lưu token và role
            localStorage.setItem('bluemoon_token', data.token);
            localStorage.setItem('bluemoon_role', data.role);

            // 2. LƯU TÊN HIỂN THỊ VÀO TRÌNH DUYỆT
            localStorage.setItem('bluemoon_owner_name', data.ownerName);

            // 3. Chuyển hướng trang
            if (data.role === 'Manager') {
                window.location.href = 'manager_dashboard.html'; 
            } else if (data.role === 'Resident') {
                window.location.href = 'resident_dashboard.html';
            }
        } else {
            errorDiv.innerText = data.message || 'Đăng nhập thất bại!';
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        errorDiv.innerText = 'Không thể kết nối đến máy chủ!';
    }
});