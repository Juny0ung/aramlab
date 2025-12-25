import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { LolDataEnqueuer } from './lol-data.enqueuer';

@Injectable()
export class LolDataScheduler implements OnModuleInit, OnApplicationShutdown {
    private readonly queue: number = 450;
    private readonly repeatpattern =  '0 0 * * * *';

    constructor(
        @Inject() private readonly lolDataEnqueuer: LolDataEnqueuer
    ) {}

    async onModuleInit(): Promise<void> {
        await this.initScheduler(this.queue);
    }

    async onApplicationShutdown(signal?: string): Promise<void> {
        await this.lolDataEnqueuer.RemovePeriodicQueue();
    }

    private async initScheduler(queue: number): Promise<void> {
        await this.lolDataEnqueuer.setPeriodicMatchUpdate(queue, this.repeatpattern);
        await this.lolDataEnqueuer.setPeriodicLolDataUpdate(queue, this.repeatpattern);
    }
}