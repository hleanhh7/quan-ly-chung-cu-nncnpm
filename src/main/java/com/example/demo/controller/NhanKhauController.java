package com.example.demo.controller;

import com.example.demo.model.NhanKhau;
import com.example.demo.Repository.NhanKhauRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/nhan-khau")
public class NhanKhauController {

    @Autowired
    private NhanKhauRepository nhanKhauRepository;

    @GetMapping
    public List<NhanKhau> getAllNhanKhau() {
        return nhanKhauRepository.findAll();
    }
}