import { Processor, WorkerHost, InjectQueue } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
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
                console.log('[LolData]\tunknown job: %s', job.name);
        }
    }

    async HandleUserData(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        this.lolDataService.updateLolData(name, queue);
    }

    async HandleMatchUser(job: Job<UserPayload>) {
        console.log('[processor]\tupdate matches');
        const { name, queue } = job.data;
        const newMatches = await this.lolDataService.getNewMatches(name, queue);

        for (const newMatch of newMatches) {
            console.log('\t\t%s added to queue', newMatch);
                this.lolDataQueue.add('match', {
                    matchId: newMatch
                });
        }
        console.log('\t\t%d match added to queue', newMatches.length);
    }

    async HandleMatch(job: Job<MatchPayLoad>) {
        const { matchId } = job.data;
        await this.lolDataService.addMatchData(matchId);
    }
}