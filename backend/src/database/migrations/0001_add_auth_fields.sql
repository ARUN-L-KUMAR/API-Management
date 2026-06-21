ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;
