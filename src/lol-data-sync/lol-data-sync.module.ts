import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LolSyncController } from './lol-data-sync.controller';
import { LolSyncService } from './lol-data-sync.service';
import { LOL_DATA_SYNC_SERVICE } from './ports/lol-data-sync.port';

@Module({
    imports: [HttpModule],
    controllers: [LolSyncController],
    providers: [
        {
            provide: LOL_DATA_SYNC_SERVICE,
            useClass: LolSyncService
        }
    ],
    exports: [LOL_DATA_SYNC_SERVICE]
})
export class LolSyncModule {}
