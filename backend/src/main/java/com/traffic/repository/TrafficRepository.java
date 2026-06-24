package com.traffic.repository;

import com.traffic.model.Traffic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrafficRepository
        extends JpaRepository<Traffic, Long> {
}
