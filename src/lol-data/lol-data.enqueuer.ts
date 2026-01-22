import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class LolDataEnqueuer {
    private readonly logger = new Logger(LolDataEnqueuer.name);

    private readonly lolDataUpdateScheduleId = 'periodic-loldata';
    private readonly matchUpdateScheduleId = 'periodic-match';
    private readonly periodicUpdateScheduleId = 'periodic-match';

    constructor(
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue,
    ) {}

    async setPeriodicUpdate(queue: number, repeatpattern: string) {
        this.logger.log('[1] set periodic update');
        await this.lolDataQueue.upsertJobScheduler(
            this.periodicUpdateScheduleId,
            { pattern: repeatpattern },
            {
                name: 'periodic-update',
                data: {
                    name: '',
                    queue: queue
                },
                opts: {
                    removeOnComplete: true,
                    removeOnFail: 3
                }
            }
        )

    }

    async setInstantLolDataUpdate(name: string, queue: number){
        if (name.length === 0) {
            this.logger.log('[1] add update lol data queue for users');
        } else {
            this.logger.log('[1] add update lol data queue for user: %s', name);
        }

        await this.lolDataQueue.add(
            'user-data', 
            {
                name: name,
                queue: queue
            },
            {
                jobId: `${queue}:${name}`
            }
        );
    }

    async setInstantMatchUpdate(name: string, queue: number) {
        if (name.length === 0) {
            this.logger.log('[1] add update matches queue for users');
        } else {
            this.logger.log('[1] add update matches queue for user: %s', name);
        }

        await this.lolDataQueue.add(
            'match-user', 
            {
                name: name,
                queue: queue
            },
            {
                jobId: `${queue}:${name}`
            }
        );
    }

    async clearQueue() {
        this.logger.log('[1] clear queue');
        await this.lolDataQueue.drain(true);
    }

    async RemovePeriodicQueue() {
        this.logger.log('[1] remove periodic queue');
        await this.lolDataQueue.removeJobScheduler(this.lolDataUpdateScheduleId);
        await this.lolDataQueue.removeJobScheduler(this.matchUpdateScheduleId);
    }
}
