package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "khoanthu")
public class KhoanThu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaKT")
    private Integer maKT;

    @Column(name = "Thang")
    private Integer thang;

    @Column(name = "Nam")
    private Integer nam;

    @Column(name = "SoTien", nullable = false)
    private Double soTien;

    @Column(name = "HanDong")
    private LocalDate hanDong;

    @Column(name = "TrangThai")
    private String trangThai;

    @ManyToOne
    @JoinColumn(name = "MaHoKhau", nullable = false)
    private HoKhau hoKhau;

    @ManyToOne
    @JoinColumn(name = "MaLoaiPhi", nullable = false)
    private LoaiPhi loaiPhi;
}