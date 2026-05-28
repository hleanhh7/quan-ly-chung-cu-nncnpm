package com.example.demo.service;

import com.example.demo.model.LoaiPhi;
import com.example.demo.Repository.LoaiPhiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LoaiPhiService {

    @Autowired
    private LoaiPhiRepository loaiPhiRepository;

    public List<LoaiPhi> getAll() { return loaiPhiRepository.findAll(); }

    public LoaiPhi getById(Integer id) {
        return loaiPhiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại phí với ID: " + id));
    }

    public LoaiPhi create(LoaiPhi loaiPhi) { return loaiPhiRepository.save(loaiPhi); }

    public LoaiPhi update(Integer id, LoaiPhi details) {
        LoaiPhi existing = getById(id);
        existing.setTenLoaiPhi(details.getTenLoaiPhi());
        existing.setDonGia(details.getDonGia());
        existing.setMoTa(details.getMoTa()); // ví dụ: bắt buộc hoặc tự nguyện
        return loaiPhiRepository.save(existing);
    }

    public void delete(Integer id) { loaiPhiRepository.delete(getById(id)); }
}