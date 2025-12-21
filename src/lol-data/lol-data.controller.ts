import { Inject, Controller, Get, Post, Param } from '@nestjs/common';
import { LOL_DATA_SERVICE } from './ports/lol-data.port';
import type { LolDataPort } from './ports/lol-data.port';
import { LolDataService } from './lol-data.service';

@Controller('loldata')
export class LolDataController {
    constructor(@Inject(LOL_DATA_SERVICE) private readonly lolDataService: LolDataPort) {}

    @Post('updateloldata/:queue/:name')
    async updateUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.updateUserLolData(name, queue);
    }

    @Post('updatematches/:queue/:name')
    async updateMatchesForUser(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.updateMatchesForUser(name, queue);
    }

    @Post('updateloldata/:queue')
    async updateAllUserData(@Param('queue') queue: number) {
        this.lolDataService.updateAllUserLolData(queue);
    }

    @Post('updatematches/:queue')
    async updateAllMatches(@Param('queue') queue: number) {
        this.lolDataService.updateAllMatches(queue);
    }

    @Get(':queue/:name')
    async getUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.getUserData(name, queue);
    }

    @Post('debug-clearqueue')
    async clearQueue() {
        if (this.lolDataService instanceof LolDataService) {
            const tempService = this.lolDataService as LolDataService;
            await tempService.clearQueue();
        }
    }
}