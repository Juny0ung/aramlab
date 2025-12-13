import { Inject, Injectable } from "@nestjs/common";
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserLolData, UserLolDataDocument } from "./schemas/userloldata.schema";
import { MatchData, MatchDataDocument, ObjectiveData } from "./schemas/matchdata.schema";
import { USERS_SERVICE } from "src/users/ports/users.port";
import type { UsersPort } from "src/users/ports/users.port";
import { MatchInfoDto, ParticipantDto, TeamDto, PerkStyleDto, PerkStyleSelectionDto } from "src/lol-data-sync/dto/lol-match.dto";
import { LOL_DATA_SYNC_SERVICE } from "src/lol-data-sync/ports/lol-data-sync.port";
import type { LolDataSyncPort } from "src/lol-data-sync/ports/lol-data-sync.port";

@Injectable()
export class LolDataService {
    constructor(
        @InjectModel(UserLolData.name) private userLolDataModel: Model<UserLolData>,
        @InjectModel(MatchData.name) private matchDataModel: Model<MatchData>,
        @Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort,
        @Inject(USERS_SERVICE) private readonly userService: UsersPort
    ) {}

    async updateMatchesForUser(name: string, queue: number): Promise<MatchDataDocument[]> {
        let result: MatchDataDocument[] = [];
        
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('no user: %s', name);
            return result;
        }

        let userLolData = await this.getUserData(name, queue);
        if (!userLolData) {
            userLolData = new this.userLolDataModel({
                userId: new Types.ObjectId(user.id)
            });
        }

        let newLastMatch: string = '';
        let newMatchNum = 0;
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

                let matchData = await this.matchDataModel.findOne({ matchId: match }).exec();
                if (matchData) {
                    console.log('already existed in db: %s', match);
                    result.push(matchData);
                    continue;
                }

                const matchInfo = await this.lolSyncService.getMatchInfo(match);
                if (!matchInfo)
                {
                    continue;
                }

                matchData = await this.createMatchData(queue, match, matchInfo);
                if (matchData) {
                    newMatchNum++;
                    result.push(matchData);
                }
            }

            if (bHasMatch) {
                break;
            }
        }

        if (newLastMatch.length > 0 && (!userLolData.lastMatch || userLolData.lastMatch !== newLastMatch)) {
            userLolData.lastMatch = newLastMatch;
            console.log('last match updated: %s', newLastMatch);
            userLolData.save();
            console.log('new %d matches added', newMatchNum);
        }
        else {
            console.log('no match updated');
        }

        return result;
    }

    async updateUserLolData(name: string, queue: number): Promise<UserLolDataDocument | null> {
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('no user: %s', name);
            return null;
        }

        let userLolData = await this.userLolDataModel
            .findOne({userId: user.id})
            .exec();

        if (!userLolData) {
            userLolData = new this.userLolDataModel({
                userId: new Types.ObjectId(user.id)
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

    async getUserData(name: string, queue: number): Promise<UserLolDataDocument | null> {
        const user = await this.userService.findOne(name);
        if (!user) {
            console.log('no user: %s', name);
            return null;
        }

        let lolData = await this.userLolDataModel
            .findOne({userId: user.id})
            .exec();

        return lolData;
    }

    async createMatchData(queue: number, matchId: string, matchInfoDto : MatchInfoDto): Promise<MatchDataDocument> {
        const { gameCreation, gameDuration, gameMode, mapId, participants, teams } = matchInfoDto;
        
        const participantDocs = participants.map((participant: ParticipantDto) => ({
            puuid: participant.puuid,
            teamId: participant.teamId,
            assists: participant.assists,
            champLevel: participant.champLevel,
            champioId: participant.championId,
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
            const bans: number[] = team.bans.map((banDto) => banDto.championId);
            
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
            queue: queue,
            participants: participantDocs,
            teams: teamDocs
        });

        return matchData.save();
    }
}
