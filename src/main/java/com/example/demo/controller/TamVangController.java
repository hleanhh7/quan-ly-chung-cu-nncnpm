package com.example.demo.controller;

import com.example.demo.model.TamVang;
import com.example.demo.Repository.TamVangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tam-vang")
public class TamVangController {

    @Autowired
    private TamVangRepository tamVangRepository;

    @GetMapping
    public List<TamVang> getAll() {
        return tamVangRepository.findAll();
    }

    @GetMapping("/{id}")
    public TamVang getById(@PathVariable Integer id) {
        return tamVangRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TamVang create(@RequestBody TamVang tamVang) {
        return tamVangRepository.save(tamVang);
    }

    @PutMapping("/{id}")
    public TamVang update(@PathVariable Integer id, @RequestBody TamVang tamVang) {
        tamVang.setMaTamVang(id);
        return tamVangRepository.save(tamVang);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        tamVangRepository.deleteById(id);
    }
}