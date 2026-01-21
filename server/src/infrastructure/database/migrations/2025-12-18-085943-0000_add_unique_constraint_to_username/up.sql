-- This file should undo anything in `up.sql`
ALTER TABLE brawlers
ADD CONSTRAINT unique_username UNIQUE (username);