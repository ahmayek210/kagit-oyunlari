-- Staging schema for the turn-based game service. Apply once to a fresh database.
CREATE TABLE guest_sessions (
 id uuid PRIMARY KEY, token_hash bytea NOT NULL UNIQUE,
 display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 22),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE TABLE rooms (
 id uuid PRIMARY KEY, code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z2-9]{6}$'),
 game_id text NOT NULL CHECK (game_id = 'shared_bridge'),
 state text NOT NULL DEFAULT 'lobby' CHECK (state IN ('lobby','playing','finished','closed')),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE TABLE room_members (
 room_id uuid NOT NULL REFERENCES rooms(id), session_id uuid NOT NULL REFERENCES guest_sessions(id),
 seat smallint NOT NULL CHECK (seat IN (1,2)), ready boolean NOT NULL DEFAULT false,
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(room_id,session_id), UNIQUE(room_id,seat)
);
CREATE TABLE matches (
 id uuid PRIMARY KEY, room_id uuid NOT NULL REFERENCES rooms(id),
 number integer NOT NULL CHECK (number > 0),
 state text NOT NULL CHECK (state IN ('playing','finished')),
 created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 UNIQUE(room_id,number), UNIQUE(id,room_id)
);
CREATE UNIQUE INDEX one_active_match_per_room ON matches(room_id) WHERE state='playing';
CREATE TABLE rounds (
 id uuid PRIMARY KEY, match_id uuid NOT NULL, room_id uuid NOT NULL,
 number integer NOT NULL CHECK (number > 0), state text NOT NULL CHECK (state IN ('playing','finished')),
 started_at timestamptz NOT NULL DEFAULT now(), deadline timestamptz NOT NULL,
 result jsonb, finished_at timestamptz,
 FOREIGN KEY(match_id,room_id) REFERENCES matches(id,room_id),
 UNIQUE(match_id,number), UNIQUE(id,room_id),
 CHECK ((state='playing' AND result IS NULL AND finished_at IS NULL) OR
        (state='finished' AND result IS NOT NULL AND finished_at IS NOT NULL))
);
CREATE TABLE submissions (
 round_id uuid NOT NULL, room_id uuid NOT NULL, session_id uuid NOT NULL,
 event_id uuid NOT NULL UNIQUE, stroke jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(round_id,session_id),
 FOREIGN KEY(round_id,room_id) REFERENCES rounds(id,room_id),
 FOREIGN KEY(room_id,session_id) REFERENCES room_members(room_id,session_id)
);
CREATE INDEX rooms_expiry ON rooms(expires_at);
CREATE INDEX sessions_expiry ON guest_sessions(expires_at);
