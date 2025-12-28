import { Processor, WorkerHost, InjectQueue } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";
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
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue,
    ) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        switch (job.name) {
            case 'user-data':
                await this.HandleUserData(job);
                break;
            case 'match-user':
                await this.HandleMatchUser(job);
                break;
            case 'match':
                await this.HandleMatch(job);
                break;
            default:
                this.logger.error('\tunknown job: %s', job.name);
        }
    }

    async HandleUserData(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        this.lolDataService.updateLolData(name, queue);
    }

    async HandleMatchUser(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        this.logger.log('[1] update matches for %s', name.length > 0 ? name : 'users');

        const newMatches = await this.lolDataService.getNewMatches(name, queue);

        for (const newMatch of newMatches) {
            this.logger.log('\t%s added to queue', newMatch);
                this.lolDataQueue.add('match', {
                    matchId: newMatch
                });
        }
        this.logger.log('[2] %d match added to queue', newMatches.length);
    }

    async HandleMatch(job: Job<MatchPayLoad>) {
        const { matchId } = job.data;
        this.logger.log('[1] add %s to db', matchId);
        await this.lolDataService.addMatchData(matchId);
    }
}