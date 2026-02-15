import { Inject, Controller, Get, Post, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { LolDataEnqueuer } from './lol-data.enqueuer';
import { LolDataService } from './lol-data.service';
import { UserLolData } from './schemas/userloldata.schema';
import { MatchData } from './schemas/matchdata.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller('loldata')
export class LolDataController {
    constructor(
        @Inject() private readonly lolDataService: LolDataService,
        @Inject() private readonly lolDataEnqueuer: LolDataEnqueuer,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    @Post('updateloldata/:queue')
    async updateAllUserData(@Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantLolDataUpdate('', queue);
    }

    @Post('updateloldata/:queue/:name')
    async updateUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantLolDataUpdate(name, queue);
        await this.lolDataEnqueuer.setInstantLolDataUpdate(name, queue);
    }

    @Post('updatematches/:queue')
    async updateAllMatches(@Param('queue') queue: number) {
        await this.lolDataEnqueuer.setInstantMatchUpdate('', queue);
    }

    @Post('updatematches/:queue/:name')
    async updateMatchesForUser(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataEnqueuer.setInstantMatchUpdate(name, queue);
        await this.lolDataEnqueuer.setInstantMatchUpdate(name, queue);
    }

    @Get('loldata/:queue/:name')
    async getUserData(@Param('name') name: string, @Param('queue') queue: number): Promise<UserLolData | null> {
        const key = `loldata:${queue}:${name}`;
        const cachedData = await this.cacheManager.get<UserLolData>(key);
        if (cachedData) {
            return cachedData;
        }

        const data = await this.lolDataService.getUserData(name, queue);
        
        if (data) {
            await this.cacheManager.set(key, data, 600000); 
        }
        return data;
    }

    @Get('matches/:queue/:name')
    async getMatches(
        @Param('name') name: string, 
        @Param('queue') queue: number, 
        @Query('count', new DefaultValuePipe(20), ParseIntPipe) count: number, 
        @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number): Promise<MatchData[]> {
        
        const key = `matches:${queue}:${name}`;
        if (page == 0) {
            const cachedMatches = await this.cacheManager.get<MatchData[]>(key);
            if (cachedMatches) {
                return cachedMatches;
            }
        }

        const matches = await this.lolDataService.getMatches(name, queue, count, page);
        
        if (page == 0 && matches && matches.length > 0) {
            await this.cacheManager.set(key, matches, 600000);
        }
        return matches;
    }

    @Post('clearqueue')
    async clearQueue() {
        this.lolDataEnqueuer.clearQueue();
    }
}