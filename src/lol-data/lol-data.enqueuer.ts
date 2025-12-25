import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class LolDataEnqueuer {
    private readonly lolDataUpdateScheduleId = 'periodic-loldata';
    private readonly matchUpdateScheduleId = 'periodic-match';

    constructor(
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue,
    ) {}

    async setPeriodicLolDataUpdate(queue: number, repeatpattern: string) {
        await this.lolDataQueue.upsertJobScheduler(
            this.lolDataUpdateScheduleId,
            { pattern: repeatpattern },
            {
                name: 'user-data',
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
            console.log('[LolData]\tadd update lol data queue for users');
        } else {
            console.log('[LolData]\tadd update lol data queue for user: %s', name);
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

    async setPeriodicMatchUpdate(queue: number, repeatpattern: string) {
        await this.lolDataQueue.upsertJobScheduler(
            this.matchUpdateScheduleId,
            { pattern: repeatpattern },
            {
                name: 'match-user',
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

    async setInstantMatchUpdate(name: string, queue: number) {
        if (name.length === 0) {
            console.log('[LolData]\tadd update matches queue for users');
        } else {
            console.log('[LolData]\tadd update matches queue for user: %s', name);
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
        console.log('clear queue');
        await this.lolDataQueue.drain(true);
    }

    async RemovePeriodicQueue() {
        await this.lolDataQueue.removeJobScheduler(this.lolDataUpdateScheduleId);
        await this.lolDataQueue.removeJobScheduler(this.matchUpdateScheduleId);
    }
}
