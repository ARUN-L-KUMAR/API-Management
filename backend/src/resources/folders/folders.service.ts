import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { folders } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class FoldersService {
  constructor(private dbService: DatabaseService) {}

  async create(name: string, orgId: string) {
    const [record] = await this.dbService.db
      .insert(folders)
      .values({
        name,
        organizationId: orgId,
      })
      .returning();
    return record;
  }

  async findAll(orgId: string) {
    return this.dbService.db
      .select()
      .from(folders)
      .where(eq(folders.organizationId, orgId));
  }

  async update(id: string, name: string, orgId: string) {
    const [record] = await this.dbService.db
      .update(folders)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(folders.id, id), eq(folders.organizationId, orgId)))
      .returning();

    if (!record) {
      throw new NotFoundException(`Folder ${id} not found`);
    }
    return record;
  }

  async remove(id: string, orgId: string) {
    const [deleted] = await this.dbService.db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.organizationId, orgId)))
      .returning();
      
    if (!deleted) {
      throw new NotFoundException(`Folder ${id} not found`);
    }
    return deleted;
  }
}
