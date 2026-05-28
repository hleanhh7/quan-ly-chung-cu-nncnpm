package com.example.demo.Repository;

import com.example.demo.model.HoKhau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoKhauRepository extends JpaRepository<HoKhau, Integer> {
}