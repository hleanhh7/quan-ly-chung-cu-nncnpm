package com.example.demo.service;

import com.example.demo.model.HoKhau;
import com.example.demo.Repository.HoKhauRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HoKhauService {

    @Autowired
    private HoKhauRepository hoKhauRepository;

    public List<HoKhau> getAll() {
        return hoKhauRepository.findAll();
    }

    public HoKhau getById(Integer id) {
        return hoKhauRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hộ khẩu với ID: " + id));
    }

    public HoKhau create(HoKhau hoKhau) {
        return hoKhauRepository.save(hoKhau);
    }
    // test commit
    public HoKhau update(Integer id, HoKhau details) {
        // 1. Tìm hộ khẩu cũ dưới DB
        HoKhau existing = getById(id);

        // 2. Gán các trường thông tin chuẩn từ details sang existing
        existing.setTenChuHo(details.getTenChuHo());
        existing.setSdt(details.getSdt());
        existing.setNgayLap(details.getNgayLap());

        // Gọi đúng hàm setCanHo() và getCanHo() do Lombok sinh ngầm
        existing.setCanHo(details.getCanHo());

        // 3. Lưu lại
        return hoKhauRepository.save(existing);
    }
    public void delete(Integer id) {
        hoKhauRepository.delete(getById(id));
    }
}