package com.example.demo.controller;

import com.example.demo.model.CanHo;
import com.example.demo.Repository.CanHoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/can-ho")
public class CanHoController {

    @Autowired
    private CanHoRepository canHoRepository;

    // GET - Lấy tất cả
    @GetMapping
    public List<CanHo> getAll() {
        return canHoRepository.findAll();
    }

    // GET - Lấy theo ID
    @GetMapping("/{id}")
    public CanHo getById(@PathVariable Integer id) {
        return canHoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy căn hộ id: " + id));
    }

    // POST - Thêm mới
    @PostMapping
    public CanHo create(@RequestBody CanHo canHo) {
        return canHoRepository.save(canHo);
    }

    // PUT - Cập nhật
    @PutMapping("/{id}")
    public CanHo update(@PathVariable Integer id, @RequestBody CanHo canHoMoi) {
        CanHo canHo = canHoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy căn hộ id: " + id));
        // cập nhật các field, ví dụ:
        canHo.setSoCanHo(canHoMoi.getSoCanHo());
        canHo.setTang(canHoMoi.getTang());
        canHo.setDienTich(canHoMoi.getDienTich());
        canHo.setTrangThai(canHoMoi.getTrangThai());
        // ... các field khác
        return canHoRepository.save(canHo);
    }

    // DELETE - Xóa
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        canHoRepository.deleteById(id);
        return "Đã xóa căn hộ id: " + id;
    }
}