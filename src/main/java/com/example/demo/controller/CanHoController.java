package com.example.demo.controller;

import com.example.demo.model.CanHo;
import com.example.demo.Repository.CanHoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/can-ho")
public class CanHoController {

    @Autowired
    private CanHoRepository canHoRepository;

    @GetMapping
    public List<CanHo> getAllCanHo() {
        return canHoRepository.findAll();
    }
}