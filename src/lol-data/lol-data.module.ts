import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LolDataService } from './lol-data.service';
import { LolDataController } from './lol-data.controller';
import { UserLolData, UserLolDataSchema  } from './schemas/userloldata.schema';
import { LolSyncModule } from 'src/lol-data-sync/lol-data-sync.module';
import { UsersModule } from 'src/users/users.module';
import { LOL_DATA_SERVICE } from './ports/lol-data.port';
import { MatchData, MatchDataSchema } from './schemas/matchdata.schema';
import { BullModule } from '@nestjs/bullmq';
import { LolDataProcessor } from './lol-data.processor';
import { LolDataEnqueuer } from './lol-data.enqueuer';
import { LolDataScheduler } from './lol-data.scheduler';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserLolData.name, schema: UserLolDataSchema},
            { name: MatchData.name, schema: MatchDataSchema }
        ]),
        BullModule.registerQueue({
            name: 'lol-data',
        }),
        BullBoardModule.forFeature({
            name: 'lol-data',
            adapter: BullMQAdapter,
        }),
        LolSyncModule,
        UsersModule
    ],
    controllers: [LolDataController],
    providers: [
        {
            provide: LOL_DATA_SERVICE,
            useClass: LolDataService
        },
        LolDataService,
        LolDataProcessor,
        LolDataEnqueuer,
        LolDataScheduler
    ],
    exports: [LOL_DATA_SERVICE]
})
export class LolDataModule {}
