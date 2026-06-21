import pg from 'pg';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
    })
);

const pool = new pg.Pool({
  connectionString: envVars.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_USER_ID = '10000000-0000-0000-0000-000000000000';
const DEFAULT_ORG_ID = 'd0000000-0000-0000-0000-000000000000';

async function main() {
  const passwordHash = await bcrypt.hash('9845', 4);

  // Update or insert the default user with a password
  await pool.query(`
    INSERT INTO users (id, email, name, password_hash)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, [DEFAULT_USER_ID, 'default@airegistry.local', 'Default Admin', passwordHash]);

  // Ensure the default org exists
  await pool.query(`
    INSERT INTO organizations (id, name, slug)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [DEFAULT_ORG_ID, 'Default Workspace', 'default-workspace']);

  // Ensure a membership exists linking the user to the org
  await pool.query(`
    INSERT INTO memberships (organization_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [DEFAULT_ORG_ID, DEFAULT_USER_ID, 'owner']);

  console.log('Admin user seeded successfully!');
  console.log('Email: default@airegistry.local');
  console.log('Password: admin123');

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
