import { Inject, Injectable, Logger } from "@nestjs/common";
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserLolData, UserLolDataDocument } from "./schemas/userloldata.schema";
import { USERS_SERVICE } from "src/users/ports/users.port";
import type { UsersPort } from "src/users/ports/users.port";
import { MatchDto, ParticipantDto, TeamDto, PerkStyleDto, PerkStyleSelectionDto } from "src/lol-data-sync/dto/lol-match.dto";
import { MatchData, MatchDataDocument, ObjectiveData } from "./schemas/matchdata.schema";
import { LOL_DATA_SYNC_SERVICE } from "src/lol-data-sync/ports/lol-data-sync.port";
import type { LolDataSyncPort } from "src/lol-data-sync/ports/lol-data-sync.port";
import { UserInfoDto } from "src/users/dto/user-info.dto";
import { dbStatus } from "./schemas/dbstatus.enum";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class LolDataService {
    private readonly logger = new Logger(LolDataService.name);

    constructor(
        @Inject(USERS_SERVICE) private readonly userService: UsersPort,
        @Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort,
        @InjectModel(UserLolData.name) private userLolDataModel: Model<UserLolData>,
        @InjectModel(MatchData.name) private matchDataModel: Model<MatchData>,
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue
    ) {}

    async getUserData(name: string, queue: number): Promise<UserLolDataDocument | null> {
        this.logger.log('[1] find user data %s (%s)', name, queue === 450 ? 'aram' : 'normal');
        const user = await this.userService.findOne(name);
        if (!user) {
            this.logger.warn('[2] no user: %s', name);
            return null;
        }

        return await this.userLolDataModel
            .findOne({userId: user.id})
            .exec();
    }

    async getMatches(name: string, queue: number, count: number, page: number): Promise<MatchDataDocument[]> {
        this.logger.log('[1] get matches for %s (%d)', name, queue);
        const user = await this.userService.findOne(name);
        if (!user) {
            this.logger.warn('[2] no user: %s', name);
            return [];
        }

        return await this.matchDataModel
            .find({ "participants.puuid": user.puuid, queue: queue})
            .sort({ gameCreation: -1 })
            .skip(count * page)
            .limit(count)
            .exec();
    }

    async loadNewMatches(name: string, queue: number) {
        let users: UserInfoDto[] = await this.getUserDtos(name);
        if (users.length === 0) {
            this.logger.warn('[2] no users');
            return;
        } else {
            this.logger.log('[2] find %d users', users.length);
        }

        let newMatchSet: Set<string> = new Set<string>();
        const bulkOps: any[] = [];
        const matchIdsInOrder: string[] = [];
        for (const user of users) {
            this.logger.log('[3] find matches for %s', user.name);
            let userLolData = await this.userLolDataModel
                .findOne({userId: user.id})
                .exec();

            if (!userLolData) {
                this.logger.log('\t%s:\tadd new lol data', user.name);
                userLolData = new this.userLolDataModel({
                    userId: user.id
                });
            }

            const lastMatch: string = userLolData.lastMatch ?? '';
            let newestMatch = '';
            for (let page = 0; page < 100; page++) {
                const matches = await this.lolSyncService.getMatches(user.puuid, queue, page);
                if (matches.length === 0) {
                    break;
                }

                if (page === 0 && matches.length > 0) {
                    newestMatch = matches[0];
                }

                let bHasMatch = false;
                for (const match of matches) {
                    if (lastMatch && lastMatch === match) {
                        bHasMatch = true;
                        break;
                    }

                    if (newMatchSet.has(match)) {
                        continue;
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { matchId: match },
                            update: { $setOnInsert: { matchId: match, dbStatus: dbStatus.Pending } },
                            upsert: true
                        }
                    });
                    matchIdsInOrder.push(match);
                    newMatchSet.add(match);
                }

                if (bHasMatch) {
                    break;
                }
            }

            if (newestMatch && newestMatch !== lastMatch) {
                userLolData.lastMatch = newestMatch;
                this.logger.log('\t%s\tlast match updated: %s', user.name, newestMatch);
                await userLolData.save();
            }
        }

        const matchesToQueue: { name: string; data: { matchId: string } }[] = [];
        if (bulkOps.length > 0) {
            const result = await this.matchDataModel.bulkWrite(bulkOps);
            const upsertedIndexes = new Set(Object.keys(result.upsertedIds).map(Number));

            for (let i = 0; i < matchIdsInOrder.length; i++) {
                if (upsertedIndexes.has(i)) {
                    matchesToQueue.push({ name: 'match', data: { matchId: matchIdsInOrder[i] } });
                } else {
                    this.logger.warn('\t%s: existed match', matchIdsInOrder[i]);
                }
            }
        }

        if (matchesToQueue.length > 0) {
            await this.lolDataQueue.addBulk(matchesToQueue);
        }

        this.logger.log('[4] %d matches loaded', newMatchSet.size);
    }

    async loadMatchData(matchId: string): Promise<MatchDataDocument | null> {
        const matchData = await this.matchDataModel.findOne({ matchId: matchId}).exec();
        if (!matchData) {
            this.logger.warn('[2] match data not found in db: %s', matchId);
            return null;
        }

        if (matchData.dbStatus !== dbStatus.Pending) {
            this.logger.warn('[2] db status of match !== pending (%s)', matchData.dbStatus);
            return matchData;
        }

        matchData.dbStatus = dbStatus.Processing;
        await matchData.save();

        let matchDbStatus = dbStatus.Failed;

        try {
            const matchDto = await this.lolSyncService.getMatchInfo(matchId);
            if (matchDto) {
                await this.updateMatchData(matchData, matchDto);
                matchDbStatus = dbStatus.Done;
                this.logger.log('[3] match data loaded: %s', matchId);
            } else {
                this.logger.warn('[3] no match data: %s', matchId);
            }
        } catch (e: any) {
            this.logger.warn('[3] load match data failed: %s', matchId);
        }

        matchData.dbStatus = matchDbStatus;
        await matchData.save();
        return matchData;
    }

    async loadFailedMatches() {
        this.logger.log('[2] find failed matches');
        const failedMatches = await this.matchDataModel.find({ dbStatus: dbStatus.Failed }).exec();

        if (failedMatches.length === 0) {
            this.logger.log('[3] no failed matches');
            return;
        }

        this.logger.log('[3] %d failed matches found', failedMatches.length);

        for (const match of failedMatches) {
            match.dbStatus = dbStatus.Pending;
            await match.save();
            await this.lolDataQueue.add('match', {
                matchId: match.matchId
            });
        }
    }

    async updateLolData(name: string, queue: number) {
        this.logger.log('[1] update lol data');
        let users: UserInfoDto[] = await this.getUserDtos(name);
        if (users.length === 0) {
            this.logger.warn('[2] no user to update');
            return;
        } else {
            this.logger.log('[2] %d users update', users.length);
        }

        for (const user of users) {
            let userLolData = await this.userLolDataModel
                .findOne({userId: user.id})
                .exec();

            if (!userLolData) {
                userLolData = new this.userLolDataModel({
                    userId: user.id
                });
            }

            const matchesData: MatchDataDocument[] = await this.matchDataModel
                .find({ "participants.puuid": user.puuid, queue: queue})
                .sort({ gameCreation: -1 })
                .exec();

            for (const matchData of matchesData) {
                // apply to user lol data
            }

            this.logger.log('[3] %s lol data updated', user.name);

            await userLolData.save();
        }
    }

    private async getUserDtos(name: string): Promise<UserInfoDto[]> {
        let users: UserInfoDto[] = [];

        if (name.length > 0) {
            const user = await this.userService.findOne(name);
            if (!user) {
                this.logger.warn('\tno user: %s', name);
                return [];
            }
            users.push(user);
        } else {
            users = await this.userService.findAll();
        }

        return users;
    }

    private async updateMatchData(matchDataDocument: MatchDataDocument, matchDto: MatchDto) {
        const { gameCreation, gameDuration, gameMode, mapId, queueId, participants, teams } = matchDto.info;
        const { dataVersion } = matchDto.metadata;

        const participantDocs = participants.map((participant: ParticipantDto) => ({
            puuid: participant.puuid,
            teamId: participant.teamId,
            assists: participant.assists,
            champLevel: participant.champLevel,
            championId: participant.championId,
            championTransform: participant.championTransform,
            damageDealtToBuildings: participant.damageDealtToBuildings,
            damageDealtToObjectives: participant.damageDealtToObjectives,
            damageDealtToTurrets: participant.damageDealtToTurrets,
            damageSelfMitigated: participant.damageSelfMitigated,
            deaths: participant.deaths,
            detectorWardsPlaced: participant.detectorWardsPlaced,
            dragonKills: participant.dragonKills,
            firstBloodAssist: participant.firstBloodAssist,
            firstBloodKill: participant.firstBloodKill,
            firstTowerAssist: participant.firstTowerAssist,
            firstTowerKill: participant.firstTowerKill,
            gameEndedInSurrender: participant.gameEndedInSurrender,
            goldEarned: participant.goldEarned,
            goldSpent: participant.goldSpent,
            individualPosition: participant.individualPosition,
            item0: participant.item0,
            item1: participant.item1,
            item2: participant.item2,
            item3: participant.item3,
            item4: participant.item4,
            item5: participant.item5,
            item6: participant.item6,
            kills: participant.kills,
            lane: participant.lane,
            longestTimeSpentLiving: participant.longestTimeSpentLiving,
            magicDamageDealt: participant.magicDamageDealt,
            magicDamageDealtToChampions: participant.magicDamageDealtToChampions,
            magicDamageTaken: participant.magicDamageTaken,
            neutralMinionsKilled: participant.neutralMinionsKilled,
            objectivesStolen: participant.objectivesStolen,
            objectivesStolenAssists: participant.objectivesStolenAssists,
            perks: {
                defenseStat: participant.perks.statPerks.defense,
                flexStat: participant.perks.statPerks.flex,
                offenseStat: participant.perks.statPerks.offense,
                perkStyles: participant.perks.styles.map((perkStyleDto: PerkStyleDto) => ({
                    description: perkStyleDto.description,
                    style: perkStyleDto.style,
                    selections: perkStyleDto.selections.map((perkSelectionDto: PerkStyleSelectionDto) => ({
                        perk: perkSelectionDto.perk,
                        var1: perkSelectionDto.var1,
                        var2: perkSelectionDto.var2,
                        var3: perkSelectionDto.var3
                    }))
                }))
            },
            physicalDamageDealt: participant.physicalDamageDealt,
            physicalDamageDealtToChampions: participant.physicalDamageDealtToChampions,
            physicalDamageTaken: participant.physicalDamageTaken,
            role: participant.role,
            summoner1Id: participant.summoner1Id,
            summoner2Id: participant.summoner2Id,
            teamPosition: participant.teamPosition,
            totalAllyJungleMinionsKilled: participant.totalAllyJungleMinionsKilled,
            totalDamageDealt: participant.totalDamageDealt,
            totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
            totalDamageShieldedOnTeammates: participant.totalDamageShieldedOnTeammates,
            totalDamageTaken: participant.totalDamageTaken,
            totalEnemyJungleMinionsKilled: participant.totalEnemyJungleMinionsKilled,
            totalHeal: participant.totalHeal,
            totalHealsOnTeammates: participant.totalHealsOnTeammates,
            totalMinionsKilled: participant.totalMinionsKilled,
            trueDamageDealt: participant.trueDamageDealt,
            trueDamageDealtToChampions: participant.trueDamageDealtToChampions,
            trueDamageTaken: participant.trueDamageTaken,
            visionScore: participant.visionScore,
            wardsKilled: participant.wardsKilled,
            wardsPlaced: participant.wardsPlaced
        }));

        const teamDocs = teams.map((team: TeamDto) => {
            let banDtos = structuredClone(team.bans);
            banDtos.sort((banA, banB) => banA.pickTurn - banB.pickTurn);
            const bans: number[] = banDtos.map((banDto) => banDto.championId);
            
            const objectives: ObjectiveData[] = [];
            for (const [key, value] of Object.entries(team.objectives)) {
                if (typeof key === 'string'
                    && value
                    && typeof value.first === 'boolean'
                    && typeof value.kills === 'number') {
                        objectives.push({
                            objectName: key,
                            first: value.first,
                            kills: value.kills
                        });
                }
            }

            return {
                teamId: team.teamId,
                win: team.win,
                bans: bans,
                objectives: objectives,
            };
        });

        matchDataDocument.dataVersion = dataVersion;
        matchDataDocument.gameCreation = new Date(gameCreation);
        matchDataDocument.gameDuration = gameDuration;
        matchDataDocument.gameMode = gameMode;
        matchDataDocument.mapId = mapId;
        matchDataDocument.queue = queueId;
        matchDataDocument.participants = participantDocs;
        matchDataDocument.teams = teamDocs;
    }
}
