import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { LolDataEnqueuer } from './lol-data.enqueuer';

@Injectable()
export class LolDataScheduler implements OnModuleInit {
    private readonly queue: number = 450;
    private readonly repeatpattern =  '0 0 * * * *';

    constructor(
        @Inject() private readonly lolDataEnqueuer: LolDataEnqueuer
    ) {}

    async onModuleInit(): Promise<void> {
        await this.initScheduler(this.queue);
    }

    private async initScheduler(queue: number): Promise<void> {
        await this.lolDataEnqueuer.setPeriodicMatchUpdate(queue, this.repeatpattern);
        await this.lolDataEnqueuer.SetPeriodicLolDataUpdate(queue, this.repeatpattern);
    }
}