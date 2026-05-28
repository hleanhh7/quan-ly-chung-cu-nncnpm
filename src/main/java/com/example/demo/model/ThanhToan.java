package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "thanhtoan")
public class ThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaThanhToan")
    private Integer maThanhToan;

    @Column(name = "NgayThanhToan")
    private LocalDate ngayThanhToan;

    @Column(name = "SoTienDaDong")
    private Double soTienDaDong;

    @Column(name = "PhuongThuc")
    private String phuongThuc;

    @ManyToOne
    @JoinColumn(name = "MaKT", nullable = false)
    private KhoanThu khoanThu;
}