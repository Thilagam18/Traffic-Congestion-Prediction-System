package com.traffic.controller;

import com.traffic.model.Traffic;
import com.traffic.service.TrafficService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traffic")
@CrossOrigin("*")
public class TrafficController {

    @Autowired
    private TrafficService trafficService;

    @GetMapping
    public List<Traffic> getAllTraffic() {
        return trafficService.getAllTrafficData();
    }

    @PostMapping
    public Traffic addTraffic(
            @RequestBody Traffic traffic) {
        return trafficService.saveTrafficData(
                traffic);
    }

    @DeleteMapping("/{id}")
    public String deleteTraffic(
            @PathVariable Long id) {

        trafficService.deleteTrafficData(id);

        return "Traffic Record Deleted";
    }
}
