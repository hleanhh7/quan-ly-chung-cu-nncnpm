package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "tamvang")
public class TamVang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTamVang")
    private Integer maTamVang;

    @Column(name = "NoiTamVang")
    private String noiTamVang;

    @Column(name = "TuNgay")
    private LocalDate tuNgay;

    @Column(name = "DenNgay")
    private LocalDate denNgay;

    @Column(name = "LyDo")
    private String lyDo;

    @ManyToOne
    @JoinColumn(name = "MaNK", nullable = false)
    private NhanKhau nhanKhau;
}