package com.example.demo.controller;

import com.example.demo.model.LoaiPhi;
import com.example.demo.Repository.LoaiPhiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/loai-phi")
public class LoaiPhiController {

    @Autowired
    private LoaiPhiRepository loaiPhiRepository;

    @GetMapping
    public List<LoaiPhi> getAll() {
        return loaiPhiRepository.findAll();
    }

    @GetMapping("/{id}")
    public LoaiPhi getById(@PathVariable Integer id) {
        return loaiPhiRepository.findById(id).orElse(null);
    }

    @PostMapping
    public LoaiPhi create(@RequestBody LoaiPhi loaiPhi) {
        return loaiPhiRepository.save(loaiPhi);
    }

    @PutMapping("/{id}")
    public LoaiPhi update(@PathVariable Integer id, @RequestBody LoaiPhi loaiPhi) {
        loaiPhi.setMaLoaiPhi(id);
        return loaiPhiRepository.save(loaiPhi);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        loaiPhiRepository.deleteById(id);
    }
}