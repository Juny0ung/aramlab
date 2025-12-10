import { Inject, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LOL_DATA_SERVICE } from './ports/lol-data.port';
import type { LolDataPort } from './ports/lol-data.port';

@Controller('loldata')
export class LolDataController {
    constructor(@Inject(LOL_DATA_SERVICE) private readonly lolDataService: LolDataPort) {}

    @Post(':queue/:name')
    async updateUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.updateUserLolData(name, queue);
    }

    @Post('updatematches/:queue/:name')
    async updateMatchesForUser(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.updateMatchesForUser(name, queue);
    }

    @Get(':queue/:name')
    async getUserData(@Param('name') name: string, @Param('queue') queue: number) {
        this.lolDataService.getUserData(name, queue);
    }
}