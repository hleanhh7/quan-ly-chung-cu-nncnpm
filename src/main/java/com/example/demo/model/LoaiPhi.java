package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "loaiphi")
public class LoaiPhi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLoaiPhi")
    private Integer maLoaiPhi;

    @Column(name = "TenLoaiPhi", nullable = false)
    private String tenLoaiPhi;

    @Column(name = "DonGia")
    private Double donGia;

    @Column(name = "MoTa")
    private String moTa;

}