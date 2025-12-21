import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Job, Queue } from "bullmq";
import { LOL_DATA_SYNC_SERVICE } from "src/lol-data-sync/ports/lol-data-sync.port";
import type { LolDataSyncPort } from "src/lol-data-sync/ports/lol-data-sync.port";
import { USERS_SERVICE } from "src/users/ports/users.port";
import type { UsersPort } from "src/users/ports/users.port";
import { UserLolData } from "./schemas/userloldata.schema";
import { Model } from "mongoose";
import { MatchDto, ParticipantDto, TeamDto, PerkStyleDto, PerkStyleSelectionDto } from "src/lol-data-sync/dto/lol-match.dto";
import { MatchData, MatchDataDocument, ObjectiveData } from "./schemas/matchdata.schema";

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
        @Inject(USERS_SERVICE) private readonly userService: UsersPort,
        @Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort,
        @InjectModel(UserLolData.name) private userLolDataModel: Model<UserLolData>,
        @InjectModel(MatchData.name) private matchDataModel: Model<MatchData>,
        @InjectQueue('lol-data') private readonly lolDataQueue: Queue
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
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('[LolData]\tno user: %s', name);
            return null;
        }

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

        return userLolData.save();
    }

    async HandleMatchUser(job: Job<UserPayload>) {
        const { name, queue } = job.data;
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('no user: %s', name);
            return;
        }
        
        console.log('[LolData]\thandle update user(%s) matches', name);
        let userLolData = await this.userLolDataModel
            .findOne({userId: user.id})
            .exec();
        if (!userLolData) {
            userLolData = new this.userLolDataModel({
                userId: user.id
            });
        }

        let newLastMatch: string = '';
        let matchCount = 0;
        for (let page = 0; page < 100; page++) {
            const matches = await this.lolSyncService.getMatches(user.puuid, queue, page);
            if (matches.length === 0) {
                break;
            }

            if (page === 0) {
                newLastMatch = matches[0];
            }

            let bHasMatch = false;
            for (const match of matches) {
                if (userLolData.lastMatch && userLolData.lastMatch === match) {
                    bHasMatch = true;
                    break;
                }
                
                console.log('\t\t%s added to queue', match);
                this.lolDataQueue.add('match', {
                    matchId: match
                });
                matchCount++;
            }

            if (bHasMatch) {
                break;
            }
        }

        console.log('\t\t%d match added to queue', matchCount);

        if (newLastMatch.length > 0 && (!userLolData.lastMatch || userLolData.lastMatch !== newLastMatch)) {
            userLolData.lastMatch = newLastMatch;
            console.log('\t\tlast match updated: %s', newLastMatch);
            await userLolData.save();
        }
        else {
            console.log('\t\tno match updated');
        }
    }

    async HandleMatch(job: Job<MatchPayLoad>) {
        const { matchId } = job.data;
        let matchData = await this.matchDataModel.findOne({ matchId: matchId }).exec();
        if (matchData) {
            console.log('[LolData]\talready existed in db: %s', matchId);
            return;
        }

        const matchDto = await this.lolSyncService.getMatchInfo(matchId);
        if (!matchDto)
        {
            console.log('[LolData]\tno match data: %s', matchId);
            return;
        }

        await this.createMatchData(matchDto);
    }

    private async createMatchData(matchDto : MatchDto): Promise<MatchDataDocument> {
        const { gameCreation, gameDuration, gameMode, mapId, queueId, participants, teams } = matchDto.info;
        const matchId = matchDto.metadata.matchId;
        
        console.log('[LolData]\tcreate new match data: %s', matchId);
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

        const matchData = new this.matchDataModel({
            matchId: matchId,
            gameCreation: new Date(gameCreation),
            gameDuration: gameDuration,
            gameMode: gameMode,
            mapId: mapId,
            queue: queueId,
            participants: participantDocs,
            teams: teamDocs
        });

        return matchData.save();
    }
}