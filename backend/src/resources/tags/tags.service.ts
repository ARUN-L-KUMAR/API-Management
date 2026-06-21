import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { tags } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class TagsService {
  constructor(private dbService: DatabaseService) {}

  async create(name: string, color: string, orgId: string) {
    const [record] = await this.dbService.db
      .insert(tags)
      .values({
        name,
        color: color || '#6366f1',
        organizationId: orgId,
      })
      .returning();
    return record;
  }

  async findAll(orgId: string) {
    return this.dbService.db
      .select()
      .from(tags)
      .where(eq(tags.organizationId, orgId));
  }

  async remove(id: string, orgId: string) {
    const [deleted] = await this.dbService.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.organizationId, orgId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
    return deleted;
  }
}
