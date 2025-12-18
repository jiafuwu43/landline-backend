INSERT INTO routes (origin, destination, distance_miles, base_price) VALUES
('Los Angeles', 'San Francisco', 380, 49.00),
('San Francisco', 'Los Angeles', 380, 49.00),
('Los Angeles', 'Las Vegas', 270, 39.00),
('Las Vegas', 'Los Angeles', 270, 39.00),
('San Francisco', 'Sacramento', 90, 25.00),
('Sacramento', 'San Francisco', 90, 25.00),
('Los Angeles', 'San Diego', 120, 29.00),
('San Diego', 'Los Angeles', 120, 29.00),
('New York', 'Boston', 215, 42.00),
('Boston', 'New York', 215, 42.00),
('New York', 'Philadelphia', 95, 28.00),
('Philadelphia', 'New York', 95, 28.00),
('Boston', 'Portland', 110, 32.00),
('Portland', 'Boston', 110, 32.00),
('Los Angeles', 'Phoenix', 370, 55.00),
('Phoenix', 'Los Angeles', 370, 55.00),
('San Francisco', 'Portland', 635, 79.00),
('Portland', 'San Francisco', 635, 79.00);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(1, '06:00:00', '10:30:00', NULL),
(1, '08:00:00', '12:30:00', NULL),
(1, '10:00:00', '14:30:00', NULL),
(1, '12:00:00', '16:30:00', NULL),
(1, '14:00:00', '18:30:00', NULL),
(1, '16:00:00', '20:30:00', NULL),
(1, '18:00:00', '22:30:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(2, '06:00:00', '10:30:00', NULL),
(2, '08:00:00', '12:30:00', NULL),
(2, '10:00:00', '14:30:00', NULL),
(2, '12:00:00', '16:30:00', NULL),
(2, '14:00:00', '18:30:00', NULL),
(2, '16:00:00', '20:30:00', NULL),
(2, '18:00:00', '22:30:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(3, '07:00:00', '11:30:00', NULL),
(3, '09:00:00', '13:30:00', NULL),
(3, '11:00:00', '15:30:00', NULL),
(3, '13:00:00', '17:30:00', NULL),
(3, '15:00:00', '19:30:00', NULL),
(3, '17:00:00', '21:30:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(4, '07:00:00', '11:30:00', NULL),
(4, '09:00:00', '13:30:00', NULL),
(4, '11:00:00', '15:30:00', NULL),
(4, '13:00:00', '17:30:00', NULL),
(4, '15:00:00', '19:30:00', NULL),
(4, '17:00:00', '21:30:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(5, '06:30:00', '08:15:00', NULL),
(5, '08:30:00', '10:15:00', NULL),
(5, '10:30:00', '12:15:00', NULL),
(5, '12:30:00', '14:15:00', NULL),
(5, '14:30:00', '16:15:00', NULL),
(5, '16:30:00', '18:15:00', NULL),
(5, '18:30:00', '20:15:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(6, '06:30:00', '08:15:00', NULL),
(6, '08:30:00', '10:15:00', NULL),
(6, '10:30:00', '12:15:00', NULL),
(6, '12:30:00', '14:15:00', NULL),
(6, '14:30:00', '16:15:00', NULL),
(6, '16:30:00', '18:15:00', NULL),
(6, '18:30:00', '20:15:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(7, '07:00:00', '09:15:00', NULL),
(7, '09:00:00', '11:15:00', NULL),
(7, '11:00:00', '13:15:00', NULL),
(7, '13:00:00', '15:15:00', NULL),
(7, '15:00:00', '17:15:00', NULL),
(7, '17:00:00', '19:15:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(8, '07:00:00', '09:15:00', NULL),
(8, '09:00:00', '11:15:00', NULL),
(8, '11:00:00', '13:15:00', NULL),
(8, '13:00:00', '15:15:00', NULL),
(8, '15:00:00', '17:15:00', NULL),
(8, '17:00:00', '19:15:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(9, '06:00:00', '10:00:00', NULL),
(9, '08:00:00', '12:00:00', NULL),
(9, '10:00:00', '14:00:00', NULL),
(9, '12:00:00', '16:00:00', NULL),
(9, '14:00:00', '18:00:00', NULL),
(9, '16:00:00', '20:00:00', NULL),
(9, '18:00:00', '22:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(10, '06:00:00', '10:00:00', NULL),
(10, '08:00:00', '12:00:00', NULL),
(10, '10:00:00', '14:00:00', NULL),
(10, '12:00:00', '16:00:00', NULL),
(10, '14:00:00', '18:00:00', NULL),
(10, '16:00:00', '20:00:00', NULL),
(10, '18:00:00', '22:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(11, '07:00:00', '09:00:00', NULL),
(11, '09:00:00', '11:00:00', NULL),
(11, '11:00:00', '13:00:00', NULL),
(11, '13:00:00', '15:00:00', NULL),
(11, '15:00:00', '17:00:00', NULL),
(11, '17:00:00', '19:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(12, '07:00:00', '09:00:00', NULL),
(12, '09:00:00', '11:00:00', NULL),
(12, '11:00:00', '13:00:00', NULL),
(12, '13:00:00', '15:00:00', NULL),
(12, '15:00:00', '17:00:00', NULL),
(12, '17:00:00', '19:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(13, '07:30:00', '09:45:00', NULL),
(13, '09:30:00', '11:45:00', NULL),
(13, '11:30:00', '13:45:00', NULL),
(13, '13:30:00', '15:45:00', NULL),
(13, '15:30:00', '17:45:00', NULL),
(13, '17:30:00', '19:45:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(14, '07:30:00', '09:45:00', NULL),
(14, '09:30:00', '11:45:00', NULL),
(14, '11:30:00', '13:45:00', NULL),
(14, '13:30:00', '15:45:00', NULL),
(14, '15:30:00', '17:45:00', NULL),
(14, '17:30:00', '19:45:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(15, '06:00:00', '12:00:00', NULL),
(15, '08:00:00', '14:00:00', NULL),
(15, '10:00:00', '16:00:00', NULL),
(15, '12:00:00', '18:00:00', NULL),
(15, '14:00:00', '20:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(16, '06:00:00', '12:00:00', NULL),
(16, '08:00:00', '14:00:00', NULL),
(16, '10:00:00', '16:00:00', NULL),
(16, '12:00:00', '18:00:00', NULL),
(16, '14:00:00', '20:00:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(17, '06:00:00', '16:30:00', NULL),
(17, '08:00:00', '18:30:00', NULL),
(17, '10:00:00', '20:30:00', NULL);

INSERT INTO schedules (route_id, departure_time, arrival_time, day_of_week) VALUES
(18, '06:00:00', '16:30:00', NULL),
(18, '08:00:00', '18:30:00', NULL),
(18, '10:00:00', '20:30:00', NULL);