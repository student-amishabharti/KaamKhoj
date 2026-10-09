INSERT INTO areas (id, name, city, lat, lng) VALUES
  (1, 'Supela', 'Bhilai', 21.2045, 81.3540),
  (2, 'Sector 6', 'Bhilai', 21.2040, 81.3790),
  (3, 'Nehru Nagar', 'Bhilai', 21.2170, 81.3390),
  (4, 'Smriti Nagar', 'Bhilai', 21.2290, 81.3330),
  (5, 'Risali', 'Bhilai', 21.1830, 81.3720),
  (6, 'Power House', 'Bhilai', 21.1960, 81.4030),
  (7, 'Hudco', 'Bhilai', 21.1960, 81.3650),
  (8, 'Padmanabhpur', 'Durg', 21.1990, 81.2900),
  (9, 'Ganjpara', 'Durg', 21.1870, 81.2830),
  (10, 'Station Road', 'Durg', 21.1900, 81.2920);
SELECT setval('areas_id_seq', (SELECT MAX(id) FROM areas));

INSERT INTO users (id, phone, name, role, area_id) VALUES
  (1, '9000000001', 'Ramesh Sahu', 'worker', 2),
  (2, '9000000002', 'Suresh Verma', 'worker', 1),
  (3, '9000000003', 'Mohan Yadav', 'worker', 8),
  (4, '9000000004', 'Dinesh Patel', 'worker', 3),
  (5, '9000000005', 'Kamla Bai', 'worker', 5),
  (6, '9000000006', 'Rajesh Sinha', 'worker', 9),
  (7, '9000000007', 'Anil Dewangan', 'worker', 7),
  (8, '9000000008', 'Santosh Nishad', 'worker', 4),
  (9, '9000000009', 'Vijay Sen', 'worker', 6),
  (10, '9000000010', 'Geeta Sahu', 'worker', 10),
  (11, '9000000011', 'Prakash Banjare', 'worker', 1),
  (12, '9000000012', 'Manoj Thakur', 'worker', 8),
  (13, '9000000013', 'ABC Painting Services', 'business', 2),
  (14, '9000000014', 'Priya Sharma', 'customer', 1),
  (15, '9000000015', 'Sunita Verma', 'customer', 8),
  (16, '9000000016', 'Rahul Gupta', 'customer', 3);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO worker_profiles (user_id, skills, available) VALUES
  (1, '{painter,mason}', true),
  (2, '{electrician}', true),
  (3, '{plumber}', false),
  (4, '{carpenter}', true),
  (5, '{cleaner}', true),
  (6, '{electrician,plumber}', true),
  (7, '{painter}', false),
  (8, '{mason}', true),
  (9, '{plumber}', true),
  (10, '{cleaner}', false),
  (11, '{carpenter}', false),
  (12, '{electrician}', false);

INSERT INTO worker_profiles
  (user_id, skills, available, business_name, team_size, working_hours, service_areas, starting_price)
VALUES
  (13, '{painter}', true, 'ABC Painting Services', 5, '10 AM - 6 PM', 'Durg, Bhilai', 1500);

INSERT INTO jobs (customer_id, worker_id, category, when_text, status, created_at)
SELECT 14 + (g % 3), w.user_id, w.skills[1], 'pichhle dino', 'completed', now() - (g || ' days')::interval
FROM worker_profiles w, generate_series(1, 20) g
WHERE g <= (w.user_id * 7) % 13 + 2
ORDER BY w.user_id, g;

INSERT INTO reviews (job_id, worker_id, customer_id, stars, comment)
SELECT j.id, j.worker_id, j.customer_id,
       3 + ((j.id * 7 + j.worker_id) % 3),
       (ARRAY['Achha kaam kiya', 'Time par aaye', 'Kaam saaf-suthra tha', 'Theek kaam tha'])[1 + (j.id % 4)]
FROM jobs j
WHERE j.status = 'completed' AND j.id % 4 <> 0;