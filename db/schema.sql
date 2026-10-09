DROP VIEW IF EXISTS worker_stats;
DROP TABLE IF EXISTS blocks, reports, reviews, jobs, otp_codes, worker_profiles, users, areas CASCADE;

CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('Durg', 'Bhilai')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('worker', 'customer', 'business')),
  area_id INT REFERENCES areas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE worker_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}'
    CHECK (skills <@ ARRAY['electrician','plumber','painter','carpenter','mason','cleaner']),
  available BOOLEAN NOT NULL DEFAULT false,
  business_name TEXT,
  team_size INT,
  working_hours TEXT,
  service_areas TEXT,
  starting_price INT
);

CREATE TABLE otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES users(id),
  worker_id INT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  when_text TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  job_id INT UNIQUE NOT NULL REFERENCES jobs(id),
  worker_id INT NOT NULL REFERENCES users(id),
  customer_id INT NOT NULL REFERENCES users(id),
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id INT NOT NULL REFERENCES users(id),
  reported_id INT NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blocks (
  blocker_id INT NOT NULL REFERENCES users(id),
  blocked_id INT NOT NULL REFERENCES users(id),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE VIEW worker_stats AS
SELECT
  w.user_id,
  COALESCE(ROUND(AVG(r.stars)::numeric, 1), 0)::float AS rating_avg,
  COUNT(r.id)::int AS review_count,
  (SELECT COUNT(*)::int FROM jobs j
     WHERE j.worker_id = w.user_id AND j.status = 'completed') AS jobs_completed
FROM worker_profiles w
LEFT JOIN reviews r ON r.worker_id = w.user_id
GROUP BY w.user_id;