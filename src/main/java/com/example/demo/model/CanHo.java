package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "canho")
public class CanHo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaCanHo")
    private Integer maCanHo;

    @Column(name = "SoCanHo", unique = true, nullable = false)
    private String soCanHo;

    @Column(name = "Tang", nullable = false)
    private Integer tang;

    @Column(name = "DienTich")
    private Double dienTich;

    @Column(name = "TrangThai")
    private String trangThai;
}