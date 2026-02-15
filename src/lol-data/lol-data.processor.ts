import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { LolDataService } from "./lol-data.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { USERS_SERVICE } from "src/users/ports/users.port";
import type { UsersPort } from "src/users/ports/users.port";

interface UserPayload {
    name: string,
    queue: number
}

interface MatchPayLoad {
    matchId: string
}

@Processor('lol-data')
export class LolDataProcessor extends WorkerHost {
    private readonly logger = new Logger(LolDataProcessor.name);

    constructor(
        @Inject() private lolDataService: LolDataService,
        @Inject(USERS_SERVICE) private readonly userService: UsersPort,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        switch (job.name) {
            case 'user-data':
                await this.handleUserData(job);
                break;
            case 'match-user':
                await this.handleMatchUser(job);
                break;
            case 'match':
                await this.handleMatch(job);
                break;
            case 'periodic-update':
                await this.handleFailedMatch();
                await this.handleMatchUser(job);
                await this.handleUserData(job);
                break;
            default:
                this.logger.error('\tunknown job: %s', job.name);
        }
    }

    async handleUserData(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        const updatedUsers: string[] = await this.lolDataService.updateLolData(name, queue);
        
        if (updatedUsers.length > 0) {
            const keys = updatedUsers.map(user => `loldata:${queue}:${user}`);
            const store = (this.cacheManager as any).store;
            if (store && typeof store.mdel === 'function') {
                await store.mdel(...keys);
            } else {
                await Promise.all(keys.map(key => this.cacheManager.del(key)));
            }
        }
    }

    async handleMatchUser(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        this.logger.log('[1] update matches for %s', name.length > 0 ? name : 'users');
        await this.lolDataService.loadNewMatches(name, queue);
    }

    async handleMatch(job: Job<MatchPayLoad>) {
        const { matchId } = job.data;
        this.logger.log('[1] load match data %s', matchId);
        const matchData = await this.lolDataService.loadMatchData(matchId);
        if (matchData && matchData.participants) {
            const userPromises = matchData.participants.map(participant => 
                this.userService.findOneBypuuid(participant.puuid)
            );
            const users = await Promise.all(userPromises);
            const updatedUsers = users.filter(user => !!user).map(user => user!.name);

            if (updatedUsers.length > 0) {
                const queue = matchData.queue ?? 450;
                const keys = updatedUsers.map(user => `matches:${queue}:${user}`);
                const store = (this.cacheManager as any).store;
                if (store && typeof store.mdel === 'function') {
                    await store.mdel(...keys);
                } else {
                    await Promise.all(keys.map(key => this.cacheManager.del(key)));
                }
            }
        }
    }

    async handleFailedMatch() {
        this.logger.log('[1] update load failed matches');
        await this.lolDataService.loadFailedMatches();
    }
}