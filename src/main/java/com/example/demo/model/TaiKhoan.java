package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "taikhoan")
@Data // Tự động tạo Getter, Setter (cần cài thư viện Lombok)
public class TaiKhoan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTK")
    private Integer maTK;

    @Column(name = "TenDangNhap", unique = true, nullable = false)
    private String tenDangNhap;

    @Column(name = "MatKhau", nullable = false)
    private String matKhau;

    @Column(name = "VaiTro", nullable = false)
    private String vaiTro;

    @Column(name = "TrangThai")
    private Integer trangThai;
}