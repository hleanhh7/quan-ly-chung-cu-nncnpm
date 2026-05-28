package com.example.demo.service;

import com.example.demo.model.KhoanThu;
import com.example.demo.Repository.KhoanThuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class KhoanThuService {

    @Autowired
    private KhoanThuRepository khoanThuRepository;

    public List<KhoanThu> getAll() { return khoanThuRepository.findAll(); }

    public KhoanThu getById(Integer id) {
        return khoanThuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoản thu với ID: " + id));
    }

    public KhoanThu create(KhoanThu khoanThu) { return khoanThuRepository.save(khoanThu); }
// test
    public KhoanThu update(Integer id, KhoanThu details) {
        KhoanThu existing = getById(id);
        existing.setThang(details.getThang());
        existing.setNam(details.getNam());
        existing.setSoTien(details.getSoTien());
        existing.setHanDong(details.getHanDong());
        existing.setTrangThai(details.getTrangThai());

        // Hai trường liên kết đối tượng (Khóa ngoại) test commit
        existing.setHoKhau(details.getHoKhau());
        existing.setLoaiPhi(details.getLoaiPhi());
        return khoanThuRepository.save(existing);
    }

    public void delete(Integer id) { khoanThuRepository.delete(getById(id)); }
}