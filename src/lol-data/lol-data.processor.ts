import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { LolDataService } from "./lol-data.service";

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
        await this.lolDataService.updateLolData(name, queue);
    }

    async handleMatchUser(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        this.logger.log('[1] update matches for %s', name.length > 0 ? name : 'users');
        await this.lolDataService.loadNewMatches(name, queue);
    }

    async handleMatch(job: Job<MatchPayLoad>) {
        const { matchId } = job.data;
        this.logger.log('[1] load match data %s', matchId);
        await this.lolDataService.loadMatchData(matchId);
    }

    async handleFailedMatch() {
        this.logger.log('[1] update load failed matches');
        await this.lolDataService.loadFailedMatches();
    }
}