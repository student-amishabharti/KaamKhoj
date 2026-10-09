-- KaamKhoj database ka naksha. Ye file chalane par purana sab mit ke naya banta hai.
DROP VIEW IF EXISTS worker_stats;
DROP TABLE IF EXISTS eval_runs, agent_logs, blocks, reports, reviews, job_applications, job_posts, jobs, otp_codes, worker_profiles, users, areas CASCADE;

-- Durg-Bhilai ke areas, approximate point ke saath (exact address kabhi nahi)
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

-- Kaarigar / business ki profile. Skills sirf in 6 categories mein se.
CREATE TABLE worker_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}'
    CHECK (skills <@ ARRAY['electrician','plumber','painter','carpenter','mason','cleaner']),
  available BOOLEAN NOT NULL DEFAULT false,
  work_note TEXT,                                  -- "kaam chahiye" wala message
  is_learner BOOLEAN NOT NULL DEFAULT false,       -- seekhne wala (helper)
  business_name TEXT,
  team_size INT,
  working_hours TEXT,
  service_areas TEXT,
  starting_price INT
);

CREATE TABLE otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0                  -- 5 galat try ke baad naya OTP
);

-- Malik ka post kiya hua kaam
CREATE TABLE job_posts (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL
    CHECK (category IN ('electrician','plumber','painter','carpenter','mason','cleaner')),
  area_id INT NOT NULL REFERENCES areas(id),
  work_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '10:00',
  hours INT NOT NULL DEFAULT 2 CHECK (hours BETWEEN 1 AND 12),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kaarigar aur kaam ka jod
-- invited = malik ne seedha bulaya, applied = kaarigar ne "Main aaunga" kaha,
-- selected = malik ne chuna, rejected = malik ne hataya, withdrawn = kaarigar ne mana / cancel kiya
CREATE TABLE job_applications (
  job_id INT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  worker_id INT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('invited', 'applied', 'selected', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, worker_id)
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES job_posts(id),
  worker_id INT NOT NULL REFERENCES users(id),
  customer_id INT NOT NULL REFERENCES users(id),
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id INT NOT NULL REFERENCES users(id),
  reported_id INT NOT NULL REFERENCES users(id),
  job_id INT REFERENCES job_posts(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blocks (
  blocker_id INT NOT NULL REFERENCES users(id),
  blocked_id INT NOT NULL REFERENCES users(id),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- AI ne kya samjha aur kya kiya (Kadam 2)
CREATE TABLE agent_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  input TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluation ke har run ka result (Kadam 3)
CREATE TABLE eval_runs (
  id SERIAL PRIMARY KEY,
  summary JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rating aur poore kaam kahin likhe nahi jaate; har baar asli data se gine jaate hain.
CREATE VIEW worker_stats AS
SELECT
  w.user_id,
  COALESCE(ROUND(AVG(r.stars)::numeric, 1), 0)::float AS rating_avg,
  COUNT(r.id)::int AS review_count,
  (SELECT COUNT(*)::int
     FROM job_applications ja
     JOIN job_posts j ON j.id = ja.job_id
    WHERE ja.worker_id = w.user_id AND ja.status = 'selected' AND j.status = 'completed') AS jobs_completed
FROM worker_profiles w
LEFT JOIN reviews r ON r.worker_id = w.user_id
GROUP BY w.user_id;