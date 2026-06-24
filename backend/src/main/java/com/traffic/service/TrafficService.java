package com.traffic.service;

import com.traffic.model.Traffic;
import com.traffic.repository.TrafficRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TrafficService {

    @Autowired
    private TrafficRepository trafficRepository;

    public List<Traffic> getAllTrafficData() {
        return trafficRepository.findAll();
    }

    public Traffic saveTrafficData(
            Traffic traffic) {
        return trafficRepository.save(traffic);
    }

    public void deleteTrafficData(Long id) {
        trafficRepository.deleteById(id);
    }
}
