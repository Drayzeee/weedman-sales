const postgres = require('postgres');

const sql = postgres(process.env.NETLIFY_DB_URL);

async function runMigration() {
  try {
    await sql`
      CREATE TABLE "teams" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `;
    
    await sql`
      ALTER TABLE "users" ADD COLUMN "team_id" integer;
    `;
    
    await sql`
      ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id");
    `;
    
    console.log('Migration complete!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  }
}

runMigration();