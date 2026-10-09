-- Demo data. Naam demo ke hain, phone number nakli hain.

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
  (16, '9000000016', 'Rahul Gupta', 'customer', 3),
  (17, '9000000017', 'Sonu Kumar', 'worker', 7),
  (18, '9000000018', 'Purane Grahak 1', 'customer', 2),
  (19, '9000000019', 'Purane Grahak 2', 'customer', 9),
  (20, '9000000020', 'Purane Grahak 3', 'customer', 4);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO worker_profiles (user_id, skills, available, work_note, is_learner) VALUES
  (1, '{painter,mason}', true, 'Painting aur chinai ka kaam chahiye, Bhilai mein kahin bhi', false),
  (2, '{electrician}', true, 'Wiring, pankha, switch board ka kaam', false),
  (3, '{plumber}', false, NULL, false),
  (4, '{carpenter}', true, 'Furniture aur darwaze ki marammat', false),
  (5, '{cleaner}', true, 'Ghar aur office ki safai, subah ka time', false),
  (6, '{electrician,plumber}', true, NULL, false),
  (7, '{painter}', false, NULL, false),
  (8, '{mason}', true, 'Chinai, plaster, tile', false),
  (9, '{plumber}', true, 'Nal, tanki, bathroom fitting', false),
  (10, '{cleaner}', false, NULL, false),
  (11, '{carpenter}', false, NULL, false),
  (12, '{electrician}', false, NULL, false),
  (17, '{painter}', true, 'Painting seekh raha hoon, helper ban ke aa sakta hoon', true);

INSERT INTO worker_profiles
  (user_id, skills, available, work_note, business_name, team_size, working_hours, service_areas, starting_price)
VALUES
  (13, '{painter}', true, 'Poora ghar paint, team ke saath', 'ABC Painting Services', 5, '10 AM - 6 PM', 'Durg, Bhilai', 1500);

-- Purane poore hue kaam: har kaarigar ke 2 se 14. Dono INSERT ka order aur shart same hai,
-- isliye ROW_NUMBER se kaam aur kaarigar ka jod sahi banta hai.
INSERT INTO job_posts (id, customer_id, category, area_id, work_date, start_time, hours, status, created_at)
SELECT ROW_NUMBER() OVER (ORDER BY w.user_id, g),
       18 + (g % 3),
       w.skills[1],
       (SELECT area_id FROM users WHERE id = 18 + (g % 3)),
       current_date - g * 3,
       '10:00',
       2 + (g % 3),
       'completed',
       now() - ((g * 3) || ' days')::interval
FROM worker_profiles w, generate_series(1, 20) g
WHERE w.user_id <> 17 AND g <= (w.user_id * 7) % 13 + 2;

INSERT INTO job_applications (job_id, worker_id, status)
SELECT ROW_NUMBER() OVER (ORDER BY w.user_id, g), w.user_id, 'selected'
FROM worker_profiles w, generate_series(1, 20) g
WHERE w.user_id <> 17 AND g <= (w.user_id * 7) % 13 + 2;

SELECT setval('job_posts_id_seq', (SELECT MAX(id) FROM job_posts));

-- Zyaadatar poore kaamon par review (har 4th par nahi)
INSERT INTO reviews (job_id, worker_id, customer_id, stars, comment)
SELECT j.id, ja.worker_id, j.customer_id,
       3 + ((j.id * 7 + ja.worker_id) % 3),
       (ARRAY['Achha kaam kiya', 'Time par aaye', 'Kaam saaf-suthra tha', 'Theek kaam tha'])[1 + (j.id % 4)]
FROM job_posts j
JOIN job_applications ja ON ja.job_id = j.id AND ja.status = 'selected'
WHERE j.status = 'completed' AND j.id % 4 <> 0;

-- Priya ka ek poora hua kaam (Ramesh ne kiya), rating abhi baaki: demo mein star dena dikhane ke liye
INSERT INTO job_posts (customer_id, category, area_id, work_date, start_time, hours, note, status)
VALUES (14, 'mason', 1, current_date - 2, '10:00', 4, 'Deewar ki marammat', 'completed');
INSERT INTO job_applications (job_id, worker_id, status)
SELECT MAX(id), 1, 'selected' FROM job_posts;

-- Demo ke liye kuch khule kaam
INSERT INTO job_posts (customer_id, category, area_id, work_date, start_time, hours, note, status) VALUES
  (15, 'plumber', 8, current_date + 1, '10:00', 2, 'Bathroom ka nal tapak raha hai', 'open'),
  (16, 'electrician', 3, current_date, '17:00', 1, 'Pankha nahi chal raha', 'open'),
  (14, 'painter', 1, current_date + 5, '09:00', 8, 'Do kamre paint karne hain', 'open');

-- Priya ke painting wale kaam par Anil ne pehle se haan kaha hai
INSERT INTO job_applications (job_id, worker_id, status)
SELECT id, 7, 'applied' FROM job_posts WHERE status = 'open' AND category = 'painter';