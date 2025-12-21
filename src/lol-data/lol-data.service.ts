import { Inject, Injectable } from "@nestjs/common";
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserLolData, UserLolDataDocument } from "./schemas/userloldata.schema";
import { USERS_SERVICE } from "src/users/ports/users.port";
import type { UsersPort } from "src/users/ports/users.port";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class LolDataService {
    constructor(
        @InjectModel(UserLolData.name) private userLolDataModel: Model<UserLolData>,
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue,
        @Inject(USERS_SERVICE) private readonly userService: UsersPort
    ) {}

    async updateMatchesForUser(name: string, queue: number) {
        console.log('[LolData]\tadd update matches queue for user: %s', name);
        await this.lolDataQueue.add('match-user', {
            name: name,
            queue: queue
        });
    }

    async updateUserLolData(name: string, queue: number){
        console.log('[LolData]\tadd update lol data queue for user: %s', name);
        await this.lolDataQueue.add('user-data', {
            name: name,
            queue: queue
        });
    }

    async getUserData(name: string, queue: number): Promise<UserLolDataDocument | null> {
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('[LolData]\tno user: %s', name);
            return null;
        }

        let lolData = await this.userLolDataModel
            .findOne({userId: user.id})
            .exec();

        return lolData;
    }

    async updateAllMatches(queue: number) {
        const users = await this.userService.findAll();
        console.log('[LolData]\tfind %d users', users.length);
        for (const user of users) {
            await this.updateMatchesForUser(user.name, queue);
        }
    }

    async updateAllUserLolData(queue: number) {
        const users = await this.userService.findAll();

        for (const user of users) {
            await this.updateUserLolData(user.name, queue);
        }
    }

    async clearQueue() {
        await this.lolDataQueue.drain(true);
    }
}
