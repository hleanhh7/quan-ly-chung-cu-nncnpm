package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "tamtru")
public class TamTru {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTamTru")
    private Integer maTamTru;

    @Column(name = "NoiTamTru")
    private String noiTamTru;

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