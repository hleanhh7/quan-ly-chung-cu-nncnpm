package com.example.demo.controller;

import com.example.demo.model.TamTru;
import com.example.demo.Repository.TamTruRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tam-tru")
public class TamTruController {

    @Autowired
    private TamTruRepository tamTruRepository;

    @GetMapping
    public List<TamTru> getAll() {
        return tamTruRepository.findAll();
    }

    @GetMapping("/{id}")
    public TamTru getById(@PathVariable Integer id) {
        return tamTruRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TamTru create(@RequestBody TamTru tamTru) {
        return tamTruRepository.save(tamTru);
    }

    @PutMapping("/{id}")
    public TamTru update(@PathVariable Integer id, @RequestBody TamTru tamTru) {
        tamTru.setMaTamTru(id);
        return tamTruRepository.save(tamTru);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        tamTruRepository.deleteById(id);
    }
}