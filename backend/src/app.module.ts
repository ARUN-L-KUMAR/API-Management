import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './resources/auth/auth.module';
import { JwtAuthGuard } from './resources/auth/jwt-auth.guard';
import { FoldersModule } from './resources/folders/folders.module';
import { TagsModule } from './resources/tags/tags.module';
import { ApiKeysModule } from './resources/api-keys/api-keys.module';
import { LogsModule } from './resources/logs/logs.module';
import { PlaygroundModule } from './resources/playground/playground.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CommonModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URL');
        if (url) {
          return {
            connection: {
              url,
              tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
            },
          };
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),
    JobsModule,
    AuthModule,
    FoldersModule,
    TagsModule,
    ApiKeysModule,
    LogsModule,
    PlaygroundModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
