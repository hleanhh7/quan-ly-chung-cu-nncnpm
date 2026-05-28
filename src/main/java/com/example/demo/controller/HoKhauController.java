package com.example.demo.controller;

import com.example.demo.model.HoKhau;
import com.example.demo.Repository.HoKhauRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ho-khau")
public class HoKhauController {

    @Autowired
    private HoKhauRepository hoKhauRepository;

    @GetMapping
    public List<HoKhau> getAll() {
        return hoKhauRepository.findAll();
    }

    @GetMapping("/{id}")
    public HoKhau getById(@PathVariable Integer id) {
        return hoKhauRepository.findById(id).orElse(null);
    }

    @PostMapping
    public HoKhau create(@RequestBody HoKhau hoKhau) {
        return hoKhauRepository.save(hoKhau);
    }

    @PutMapping("/{id}")
    public HoKhau update(@PathVariable Integer id, @RequestBody HoKhau hoKhau) {
        hoKhau.setMaHoKhau(id);
        return hoKhauRepository.save(hoKhau);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        hoKhauRepository.deleteById(id);
    }
}