package com.example.demo.controller;

import com.example.demo.model.KhoanThu;
import com.example.demo.Repository.KhoanThuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/khoan-thu")
public class KhoanThuController {

    @Autowired
    private KhoanThuRepository khoanThuRepository;

    @GetMapping
    public List<KhoanThu> getAll() {
        return khoanThuRepository.findAll();
    }

    @GetMapping("/{id}")
    public KhoanThu getById(@PathVariable Integer id) {
        return khoanThuRepository.findById(id).orElse(null);
    }

    @GetMapping("/chua-dong")
    public List<KhoanThu> getChuaDong() {
        return khoanThuRepository.findByTrangThai("Chưa đóng");
    }

    @PostMapping
    public KhoanThu create(@RequestBody KhoanThu khoanThu) {
        return khoanThuRepository.save(khoanThu);
    }

    @PutMapping("/{id}")
    public KhoanThu update(@PathVariable Integer id, @RequestBody KhoanThu khoanThu) {
        khoanThu.setMaKT(id);
        return khoanThuRepository.save(khoanThu);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        khoanThuRepository.deleteById(id);
    }
}