import { Inject, Controller, Get, Post, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { LolDataEnqueuer } from './lol-data.enqueuer';
import { LolDataService } from './lol-data.service';
import { UserLolData } from './schemas/userloldata.schema';
import { MatchData } from './schemas/matchdata.schema';

@Controller('loldata')
export class LolDataController {
    constructor(
        @Inject() private readonly lolDataService: LolDataService,
        @Inject() private readonly lolDataEnqueuer: LolDataEnqueuer
    ) {}

    @Post('updateloldata/:queue')
    async updateAllUserData(@Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantLolDataUpdate('', queue);
    }

    @Post('updateloldata/:queue/:name')
    async updateUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantLolDataUpdate(name, queue);
    }

    @Post('updatematches/:queue')
    async updateAllMatches(@Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantMatchUpdate('', queue);
    }

    @Post('updatematches/:queue/:name')
    async updateMatchesForUser(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantMatchUpdate(name, queue);
    }

    @Get('loldata/:queue/:name')
    getUserData(@Param('name') name: string, @Param('queue') queue: number): Promise<UserLolData | null> {
        return this.lolDataService.getUserData(name, queue);
    }

    @Get('matches/:queue/:name')
    getMatches(
        @Param('name') name: string, 
        @Param('queue') queue: number, 
        @Query('count', new DefaultValuePipe(20), ParseIntPipe) count: number, 
        @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number): Promise<MatchData[]> {
        return this.lolDataService.getMatches(name, queue, count, page);
    }

    @Post('clearqueue')
    async clearQueue() {
        this.lolDataEnqueuer.clearQueue();
    }
}