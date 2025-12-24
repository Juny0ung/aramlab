import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class LolDataEnqueuer {
    constructor(
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue,
    ) {}

    async SetPeriodicLolDataUpdate(queue: number, repeatpattern: string) {
        await this.lolDataQueue.add(
            'user-data',
            {
                name: '',
                queue: queue
            },
            { 
                jobId: 'periodicupdate',
                repeat: { pattern: repeatpattern}
            }
        );
    }

    async SetInstantLolDataUpdate(name: string, queue: number){
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
        await this.lolDataQueue.add(
            'match-user',
            {
                name: '',
                queue: queue
            },
            { 
                jobId: 'periodicupdate',
                repeat: { pattern: repeatpattern}
            }
        );
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
}
