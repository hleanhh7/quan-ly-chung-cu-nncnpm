package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "hokhau")
public class HoKhau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaHoKhau")
    private Integer maHoKhau;

    @Column(name = "TenChuHo", nullable = false)
    private String tenChuHo;

    @Column(name = "SDT")
    private String sdt;

    @Column(name = "NgayLap")
    private LocalDate ngayLap;

    @OneToOne
    @JoinColumn(name = "MaCanHo", unique = true)
    private CanHo canHo;

}