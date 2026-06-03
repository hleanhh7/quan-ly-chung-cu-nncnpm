document.getElementById('loginForm').addEventListener('submit', async function(event) {
    // Ngăn chặn hành vi tải lại trang mặc định của form
    event.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    // Xóa thông báo lỗi cũ (nếu có)
    errorDiv.innerText = '';

    try {
        // Giao tiếp với Backend qua fetch API
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
            // Đăng nhập thành công!
            alert('Đăng nhập thành công!');
            
            // 1. Cất Token vào két sắt của trình duyệt
            localStorage.setItem('bluemoon_token', data.token);
            
            // 2. Cất thông tin Role để biết đường chuyển hướng
            localStorage.setItem('bluemoon_role', data.user.role);

            // 3. Phân luồng chuyển hướng trang web
            if (data.user.role === 'Manager') {
                // Chuyển sang trang dành cho Quản lý (chúng ta sẽ tạo sau)
                window.location.href = 'manager_dashboard.html'; 
            } else if (data.user.role === 'Resident') {
                // Chuyển sang trang dành cho Cư dân (chúng ta sẽ tạo sau)
                window.location.href = 'resident_dashboard.html';
            }
        } else {
            // Đăng nhập thất bại (Sai pass, user không tồn tại...)
            errorDiv.innerText = data.message || 'Đăng nhập thất bại!';
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        errorDiv.innerText = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend!';
    }
});