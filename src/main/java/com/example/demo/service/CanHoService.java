package com.example.demo.service;

import com.example.demo.model.CanHo;
import com.example.demo.Repository.CanHoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CanHoService {

    @Autowired
    private CanHoRepository canHoRepository;

    // 1. Lấy toàn bộ danh sách căn hộ
    public List<CanHo> getAll() {
        return canHoRepository.findAll();
    }

    // 2. Tìm căn hộ theo ID, nếu không thấy thì báo lỗi ngay lập tức
    public CanHo getById(Integer id) {
        return canHoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy căn hộ với ID: " + id));
    }

    // 3. Thêm mới căn hộ
    public CanHo create(CanHo canHo) {
        return canHoRepository.save(canHo);
    }

    // 4. Cập nhật thông tin căn hộ (An toàn, tự sửa bằng tay chuẩn theo thuộc tính của bạn)
    public CanHo update(Integer id, CanHo details) {
        // Tìm xem căn hộ cũ có tồn tại thực sự dưới database không
        CanHo existing = getById(id);

        // Tự gán các trường thực tế khớp 100% với Entity CanHo.java của bạn
        existing.setSoCanHo(details.getSoCanHo());
        existing.setTang(details.getTang());
        existing.setDienTich(details.getDienTich());
        existing.setTrangThai(details.getTrangThai());

        // Lưu lại căn hộ cũ đã được cập nhật thông tin mới
        return canHoRepository.save(existing);
    }

    // 5. Xóa căn hộ
    public void delete(Integer id) {
        // Kiểm tra xem có tồn tại trước khi xóa để tránh lỗi văng ứng dụng
        CanHo canHo = getById(id);
        canHoRepository.delete(canHo);
    }
}