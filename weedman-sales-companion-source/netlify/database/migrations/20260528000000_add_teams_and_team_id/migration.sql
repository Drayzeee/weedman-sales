CREATE TABLE "teams" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "users" ADD COLUMN "team_id" integer;

ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id");