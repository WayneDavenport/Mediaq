CREATE TABLE public.books (
  id uuid NOT NULL,
  authors text NULL,
  average_rating bigint NULL,
  categories text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  estimated_reading_time bigint NULL,
  google_books_id text NULL,
  isbn text NULL,
  language text NULL,
  page_count bigint NULL,
  preview_link text NULL,
  published_date text NULL,
  publisher text NULL,
  ratings_count integer NULL,
  reading_speed smallint NULL,
  user_id uuid NULL,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books USING btree (user_id);

CREATE TABLE public.comment_replies (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  comment_id uuid NULL,
  content text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  user_id uuid NULL,
  CONSTRAINT comment_replies_pkey PRIMARY KEY (id),
  CONSTRAINT comment_replies_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT comment_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON public.comment_replies USING btree (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user_id ON public.comment_replies USING btree (user_id);

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  content text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  media_item_id uuid NULL,
  user_id uuid NULL,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_media_item_id_fkey FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_media_item_id ON public.comments USING btree (media_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments USING btree (user_id);

CREATE TABLE public.completed_locks (
  id uuid NOT NULL,
  completed_at timestamp with time zone NULL,
  completed_time integer NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  episodes_completed integer NULL,
  goal_episodes integer NULL,
  goal_pages integer NULL,
  goal_time integer NULL,
  key_parent_id uuid NULL,
  key_parent_text text NULL,
  lock_type text NULL,
  media_item_id uuid NULL,
  original_lock_id uuid NULL,
  pages_completed integer NULL,
  user_id uuid NULL,
  CONSTRAINT completed_locks_pkey PRIMARY KEY (id),
  CONSTRAINT completed_locks_media_item_id_fkey FOREIGN KEY (media_item_id) REFERENCES media_items(id),
  CONSTRAINT completed_locks_original_lock_id_fkey FOREIGN KEY (original_lock_id) REFERENCES locked_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_completed_locks_user_id ON public.completed_locks USING btree (user_id);

CREATE TABLE public.friend_requests (
  created_at timestamp with time zone NULL DEFAULT now(),
  receiver_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  status text NULL,
  CONSTRAINT friend_requests_pkey PRIMARY KEY (sender_id, receiver_id),
  CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON public.friend_requests USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON public.friend_requests USING btree (sender_id);

CREATE TABLE public.friends (
  created_at timestamp with time zone NULL DEFAULT now(),
  friend_id uuid NOT NULL,
  friend_user_name text NULL,
  user_id uuid NOT NULL,
  CONSTRAINT friends_pkey PRIMARY KEY (user_id, friend_id),
  CONSTRAINT fk_friends_friend_id FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friends_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends USING btree (friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends USING btree (user_id);

CREATE TABLE public.games (
  id uuid NOT NULL,
  achievements_count bigint NULL,
  average_playtime bigint NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  esrb_rating text NULL,
  genres text NULL,
  metacritic integer NULL,
  platforms text NULL,
  publishers text NULL,
  rating double precision NULL,
  rating_count bigint NULL,
  rawg_id bigint NULL,
  release_date text NULL,
  user_id uuid NULL,
  website text NULL,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games USING btree (user_id);

CREATE TABLE public.gmg_games (
  id text NOT NULL,
  affiliate_link text NULL,
  brand text NULL,
  currency text NULL,
  description text NULL,
  drm text NULL,
  image_url text NULL,
  last_updated timestamp with time zone NULL DEFAULT now(),
  manufacturer text NULL,
  price numeric NULL,
  source text NULL,
  steam_app_id text NULL,
  title text NULL,
  CONSTRAINT gmg_games_pkey PRIMARY KEY (id)
);

CREATE TABLE public.locked_items (
  id uuid NOT NULL,
  completed boolean NULL,
  completed_time bigint NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  episodes_completed bigint NULL,
  goal_episodes bigint NULL,
  goal_pages bigint NULL,
  goal_time bigint NULL,
  key_parent_id uuid NULL,
  key_parent_text text NULL,
  lock_completed_timestampz timestamp with time zone NULL,
  lock_type text NULL,
  pages_completed bigint NULL,
  user_id uuid NULL,
  CONSTRAINT locked_items_pkey PRIMARY KEY (id),
  CONSTRAINT locked_items_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_locked_items_user_id ON public.locked_items USING btree (user_id);

CREATE TABLE public.media_items (
  id uuid NOT NULL,
  backdrop_path text NULL,
  category text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  description text NULL,
  genres text NULL,
  media_type text NULL,
  poster_path text NULL,
  title text NULL,
  user_email text NULL,
  user_id uuid NULL,
  CONSTRAINT media_items_pkey PRIMARY KEY (id),
  CONSTRAINT media_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON public.media_items USING btree (user_id);

CREATE TABLE public.movies (
  id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  director text NULL,
  original_language text NULL,
  release_date text NULL,
  runtime bigint NULL,
  tmdb_id bigint NULL,
  user_id uuid NULL,
  vote_average double precision NULL,
  CONSTRAINT movies_pkey PRIMARY KEY (id),
  CONSTRAINT movies_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON public.movies USING btree (user_id);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  comment_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  is_read boolean NULL,
  media_item_id uuid NULL,
  message text NULL,
  receiver_id uuid NULL,
  reply_id uuid NULL,
  sender_id uuid NULL,
  type character varying NULL,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES comments(id),
  CONSTRAINT notifications_media_item_id_fkey FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT notifications_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_reply_id_fkey FOREIGN KEY (reply_id) REFERENCES comment_replies(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications USING btree (sender_id);

CREATE TABLE public.tv_shows (
  id uuid NOT NULL,
  average_runtime bigint NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  episode_run_times bigint NULL,
  original_language text NULL,
  release_date text NULL,
  seasons bigint NULL,
  tmdb_id bigint NULL,
  total_episodes bigint NULL,
  user_id uuid NULL,
  vote_average integer NULL,
  CONSTRAINT tv_shows_pkey PRIMARY KEY (id),
  CONSTRAINT tv_shows_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tv_shows_user_id ON public.tv_shows USING btree (user_id);

CREATE TABLE public.user_media_progress (
  id uuid NOT NULL,
  completed boolean NULL,
  completed_duration bigint NULL,
  completed_timestampz timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  duration real NULL,
  episodes_completed bigint NULL,
  pages_completed bigint NULL,
  queue_number bigint NULL,
  user_id uuid NULL,
  notes text NULL,
  CONSTRAINT user_media_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_media_progress_id_fkey FOREIGN KEY (id) REFERENCES media_items(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_media_progress_user_id ON public.user_media_progress USING btree (user_id);

CREATE TABLE public.user_recommendations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  created_at timestamp with time zone NULL DEFAULT now(),
  media_item_data jsonb NULL,
  message text NULL,
  receiver_id uuid NULL,
  sender_id uuid NULL,
  status text NULL,
  CONSTRAINT user_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT user_recommendations_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_recommendations_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_receiver_id ON public.user_recommendations USING btree (receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_sender_id ON public.user_recommendations USING btree (sender_id);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  avatar_url text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  email text,
  first_name character varying NULL,
  google_id text NULL,
  is_admin boolean NULL DEFAULT false,
  is_verified boolean NULL DEFAULT false,
  last_name character varying NULL,
  password text NULL,
  reading_speed real NULL,
  username text NULL,
  verification_token text NULL,
  verified_at timestamp without time zone NULL,
  password_reset_token text NULL,
  password_reset_expires timestamp with time zone NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username)
);