package com.example.demo.controller;

import com.example.demo.model.TaiKhoan;
import com.example.demo.Repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tai-khoan")
public class TaiKhoanController {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @GetMapping
    public List<TaiKhoan> getAll() {
        return taiKhoanRepository.findAll();
    }

    @GetMapping("/{id}")
    public TaiKhoan getById(@PathVariable Integer id) {
        return taiKhoanRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TaiKhoan create(@RequestBody TaiKhoan taiKhoan) {
        return taiKhoanRepository.save(taiKhoan);
    }

    @PutMapping("/{id}")
    public TaiKhoan update(@PathVariable Integer id, @RequestBody TaiKhoan taiKhoan) {
        taiKhoan.setMaTK(id);
        return taiKhoanRepository.save(taiKhoan);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        taiKhoanRepository.deleteById(id);
    }
}