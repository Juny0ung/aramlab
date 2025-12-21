import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { UsersModule } from './users/users.module';
import { LolSyncModule } from './lol-data-sync/lol-data-sync.module';
import { LolDataModule } from './lol-data/lol-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        LOL_API_KEY: Joi.string().required()
      })
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379)
      }
    }),
    UsersModule,
    LolSyncModule,
    LolDataModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
