CREATE DATABASE traffic_db;

USE traffic_db;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE roads (
    road_id INT PRIMARY KEY AUTO_INCREMENT,
    road_name VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE traffic_data (
    traffic_id INT PRIMARY KEY AUTO_INCREMENT,
    road_id INT,
    vehicle_count INT,
    congestion_level VARCHAR(50),
    recorded_time TIMESTAMP,
    FOREIGN KEY (road_id) REFERENCES roads(road_id)
);

CREATE TABLE route_history (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    source VARCHAR(100),
    destination VARCHAR(100),
    optimized_route TEXT
);

CREATE TABLE alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    road_id INT,
    alert_message TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (road_id) REFERENCES roads(road_id)
);
