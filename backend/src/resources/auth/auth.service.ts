import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { users, organizations, memberships } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const [existing] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.dbService.db
      .insert(users)
      .values({
        email: dto.email,
        name: dto.name || dto.email.split('@')[0],
        passwordHash,
      })
      .returning();

    const orgSlug = `org-${user.id.substring(0, 8)}`;
    const [org] = await this.dbService.db
      .insert(organizations)
      .values({
        name: `${(dto.name || user.email).split('@')[0]}'s Workspace`,
        slug: orgSlug,
      })
      .returning();

    await this.dbService.db
      .insert(memberships)
      .values({
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
      });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId: org.id,
      role: 'owner',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const [membership] = await this.dbService.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .limit(1);

    const orgId = membership?.organizationId || this.configService.get<string>('DEFAULT_ORG_ID', 'd0000000-0000-0000-0000-000000000000');
    const role = membership?.role || 'member';

    await this.dbService.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const [org] = await this.dbService.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId: orgId,
      role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: org
        ? { id: org.id, name: org.name, slug: org.slug }
        : { id: orgId, name: 'Default Workspace', slug: 'default-workspace' },
    };
  }

  async getMe(userId: string, orgId: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [org] = await this.dbService.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: org
        ? { id: org.id, name: org.name, slug: org.slug }
        : { id: orgId, name: 'Default Workspace', slug: 'default-workspace' },
    };
  }
}
