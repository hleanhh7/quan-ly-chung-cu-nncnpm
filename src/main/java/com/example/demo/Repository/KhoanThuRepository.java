package com.example.demo.Repository;

import com.example.demo.model.KhoanThu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KhoanThuRepository extends JpaRepository<KhoanThu, Integer> {
    List<KhoanThu> findByTrangThai(String trangThai);
}