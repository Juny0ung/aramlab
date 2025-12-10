import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LolSyncModule } from 'src/lol-data-sync/lol-data-sync.module';
import { USERS_SERVICE } from './ports/users.port';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema}]),
        LolSyncModule
    ],
    controllers: [UsersController],
    providers: [
        {
            provide: USERS_SERVICE,
            useClass: UsersService
        }
    ],
    exports: [USERS_SERVICE]
})
export class UsersModule {}
