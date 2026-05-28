package com.example.demo.controller;

import com.example.demo.model.ThanhToan;
import com.example.demo.Repository.ThanhToanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/thanh-toan")
public class ThanhToanController {

    @Autowired
    private ThanhToanRepository thanhToanRepository;

    @GetMapping
    public List<ThanhToan> getAll() {
        return thanhToanRepository.findAll();
    }

    @GetMapping("/{id}")
    public ThanhToan getById(@PathVariable Integer id) {
        return thanhToanRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ThanhToan create(@RequestBody ThanhToan thanhToan) {
        return thanhToanRepository.save(thanhToan);
    }

    @PutMapping("/{id}")
    public ThanhToan update(@PathVariable Integer id, @RequestBody ThanhToan thanhToan) {
        thanhToan.setMaThanhToan(id);
        return thanhToanRepository.save(thanhToan);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        thanhToanRepository.deleteById(id);
    }
}