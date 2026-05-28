package com.example.demo.Repository;

import com.example.demo.model.LoaiPhi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoaiPhiRepository extends JpaRepository<LoaiPhi, Integer> {
}