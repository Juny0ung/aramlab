import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LolDataService } from './lol-data.service';
import { LolDataController } from './lol-data.controller';
import { UserLolData, UserLolDataSchema  } from './schemas/userloldata.schema';
import { LolSyncModule } from 'src/lol-data-sync/lol-data-sync.module';
import { UsersModule } from 'src/users/users.module';
import { LOL_DATA_SERVICE } from './ports/lol-data.port';
import { MatchData, MatchDataSchema } from './schemas/matchdata.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserLolData.name, schema: UserLolDataSchema},
            { name: MatchData.name, schema: MatchDataSchema }
        ]),
        LolSyncModule,
        UsersModule
    ],
    controllers: [LolDataController],
    providers: [
        {
            provide: LOL_DATA_SERVICE,
            useClass: LolDataService
        }
    ],
    exports: [LOL_DATA_SERVICE]
})
export class LolDataModule {}
