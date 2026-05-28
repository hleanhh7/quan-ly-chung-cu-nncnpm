package com.example.demo.service;

import com.example.demo.model.NhanKhau; // Sửa lại model hoặc entity tùy dự án của bạn
import com.example.demo.Repository.NhanKhauRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NhanKhauService {

    @Autowired
    private NhanKhauRepository nhanKhauRepository;

    public List<NhanKhau> getAll() {
        return nhanKhauRepository.findAll();
    }

    public NhanKhau getById(Integer id) {
        return nhanKhauRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân khẩu với ID: " + id));
    }

    public NhanKhau create(NhanKhau nhanKhau) {
        return nhanKhauRepository.save(nhanKhau);
    }

    public NhanKhau update(Integer id, NhanKhau details) {
        NhanKhau existing = getById(id);

        // Cập nhật từng trường (Hãy đổi tên getter/setter cho khớp với thuộc tính file Java của bạn)
        existing.setHoTen(details.getHoTen());
        existing.setNgaySinh(details.getNgaySinh());
        existing.setGioiTinh(details.getGioiTinh());
        existing.setCccd(details.getCccd());
        existing.setNgheNghiep(details.getNgheNghiep());
        existing.setHoKhau(details.getHoKhau()); // Nếu có liên kết bảng hộ khẩu

        return nhanKhauRepository.save(existing);
    }

    public void delete(Integer id) {
        NhanKhau nhanKhau = getById(id);
        nhanKhauRepository.delete(nhanKhau);
    }
}