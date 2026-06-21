import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public db: NodePgDatabase<typeof schema>;
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing');
    }

    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });

    this.db = drizzle(this.pool, { schema });

    // Seed default tenant and user to satisfy foreign key constraints during local testing
    try {
      const defaultOrgId = 'd0000000-0000-0000-0000-000000000000';
      const defaultUserId = '10000000-0000-0000-0000-000000000000';

      const [existingOrg] = await this.db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, defaultOrgId))
        .limit(1);

      if (!existingOrg) {
        await this.db.insert(schema.organizations).values({
          id: defaultOrgId,
          name: 'Default Workspace',
          slug: 'default-workspace',
        });
      }

      const [existingUser] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, defaultUserId))
        .limit(1);

      if (!existingUser) {
        const defaultPasswordHash = await bcrypt.hash('admin123', 12);
        await this.db.insert(schema.users).values({
          id: defaultUserId,
          email: 'default@airegistry.local',
          name: 'Default Admin',
          passwordHash: defaultPasswordHash,
        });
      }

      // Ensure default admin has a membership
      const [existingMembership] = await this.db
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.userId, defaultUserId))
        .limit(1);

      if (!existingMembership) {
        await this.db.insert(schema.memberships).values({
          organizationId: defaultOrgId,
          userId: defaultUserId,
          role: 'owner',
        });
      }
    } catch (err: any) {
      console.warn('Auto-seeding default tenant warning (ignoring if tables not yet created):', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
