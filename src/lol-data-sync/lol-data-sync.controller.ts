import { Controller, Get, Param, Inject } from '@nestjs/common';
import { LOL_DATA_SYNC_SERVICE } from './ports/lol-data-sync.port';
import type { LolDataSyncPort } from './ports/lol-data-sync.port';


@Controller('lolsync')
export class LolSyncController {
    constructor(@Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort) {}

    @Get('puuid/:nickname/:tag')
    getPuuid(@Param('nickname') nickname: string, @Param('tag') tag: string) {
        return this.lolSyncService.getPuuid(nickname, tag);
    }

    @Get('matches/:queue/:puuid/:page')
    getMatches(@Param('puuid') puuid: string, @Param('queue') queue: number, @Param('page') page: number) {
        return this.lolSyncService.getMatches(puuid, queue, page);
    }

    @Get('matchInfo/:matchid')
    getMatchInfo(@Param('matchid') matchid: string) {
        return this.lolSyncService.getMatchInfo(matchid);
    }
}