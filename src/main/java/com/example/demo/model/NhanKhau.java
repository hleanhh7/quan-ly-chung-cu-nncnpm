package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "nhankhau")
public class NhanKhau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaNK")
    private Integer maNK;

    @Column(name = "HoTen", nullable = false)
    private String hoTen;

    @Column(name = "NgaySinh")
    private LocalDate ngaySinh;

    @Column(name = "GioiTinh")
    private String gioiTinh;

    @Column(name = "CCCD", unique = true)
    private String cccd;

    @Column(name = "QueQuan")
    private String queQuan;

    @Column(name = "DanToc")
    private String danToc;

    @Column(name = "NgheNghiep")
    private String ngheNghiep;

    @Column(name = "QuanHeChuHo")
    private String quanHeChuHo;

    @Column(name = "TrangThaiCuTru")
    private String trangThaiCuTru;

    @ManyToOne
    @JoinColumn(name = "MaHoKhau")
    private HoKhau hoKhau;

    @OneToOne
    @JoinColumn(name = "MaTK", unique = true)
    private TaiKhoan taiKhoan;
}