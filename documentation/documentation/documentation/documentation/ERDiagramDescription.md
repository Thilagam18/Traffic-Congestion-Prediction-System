# ER Diagram Description

Entities:

1. User
   - UserID
   - Name
   - Email
   - Password

2. TrafficData
   - TrafficID
   - Location
   - VehicleCount
   - AverageSpeed
   - Timestamp

3. Prediction
   - PredictionID
   - CongestionLevel
   - PredictionTime

4. Route
   - RouteID
   - Source
   - Destination
   - Distance
   - EstimatedTime

Relationships:
- User views Predictions.
- TrafficData generates Predictions.
- Predictions are used for Route Optimization.
