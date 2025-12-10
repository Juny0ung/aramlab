import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDataDocument = HydratedDocument<MatchData>;

@Schema({_id: false})
class PerkSelectionData {
    @Prop()
    perk: number;
    
    @Prop()
    var1: number;
    
    @Prop()
    var2: number;
    
    @Prop()
    var3: number;
}

const PerkSelectionDataSchema = SchemaFactory.createForClass(PerkSelectionData);

@Schema({_id: false})
class PerkStyleData {
    @Prop()
    description: string;

    @Prop()
    style: number;

    @Prop({type: [PerkSelectionDataSchema]})
    selections: PerkSelectionData[];
}

const PerkStyleDataSchema = SchemaFactory.createForClass(PerkStyleData);

@Schema({_id: false})
export class PerkData {
    @Prop()
    defenseStat: number;
    
    @Prop()
    flexStat: number;

    @Prop()
    offenseStat: number;

    @Prop({type: [PerkStyleDataSchema]})
    perkStyles: PerkStyleData[];
}

const PerkDataSchema = SchemaFactory.createForClass(PerkData);

@Schema({_id : false})
class ParticipantData {
    @Prop()
    puuid: string;

    @Prop()
    teamId: number;

    @Prop()
    assists: number;
    
    @Prop()
    champLevel: number;
    
    @Prop()
    championId: number;
    
    @Prop()
    championTransform: number;
    
    @Prop()
    damageDealtToBuildings: number;
    
    @Prop()
    damageDealtToObjectives: number;
    
    @Prop()
    damageDealtToTurrets: number;
    
    @Prop()
    damageSelfMitigated: number;
    
    @Prop()
    deaths: number;
    
    @Prop()
    detectorWardsPlaced: number;
    
    @Prop()
    dragonKills: number;
    
    @Prop()
    firstBloodAssist: boolean;
    
    @Prop()
    firstBloodKill: boolean;
    
    @Prop()
    firstTowerAssist: boolean;
    
    @Prop()
    firstTowerKill: boolean;
    
    @Prop()
    gameEndedInSurrender: boolean;
    
    @Prop()
    goldEarned: number;
    
    @Prop()
    goldSpent: number;
    
    @Prop()
    individualPosition: string;
    
    @Prop()
    item0: number;
    
    @Prop()
    item1: number;
    
    @Prop()
    item2: number;
    
    @Prop()
    item3: number;
    
    @Prop()
    item4: number;
    
    @Prop()
    item5: number;
    
    @Prop()
    item6: number;
    
    @Prop()
    kills: number;
    
    @Prop()
    lane: string;
    
    @Prop()
    longestTimeSpentLiving: number;
    
    @Prop()
    magicDamageDealt: number;
    
    @Prop()
    magicDamageDealtToChampions: number;
    
    @Prop()
    magicDamageTaken: number;
    
    @Prop()
    neutralMinionsKilled: number;
    
    @Prop()
    objectivesStolen: number;
    
    @Prop()
    objectivesStolenAssists: number;
    
    @Prop({type: PerkDataSchema})
    perks: PerkData;
    
    @Prop()
    physicalDamageDealt: number;
    
    @Prop()
    physicalDamageDealtToChampions: number;
    
    @Prop()
    physicalDamageTaken: number;
    
    @Prop()
    role: string;
    
    // 1    heal
    // 3    exhaust
    // 4    flash
    // 6    ghost
    // 7    heal (old)
    // 10   tp
    // 11   smite
    // 12   mana
    // 13   mana (old)
    // 14   ignite
    // 21   barrier
    // 30   poro
    @Prop()
    summoner1Id: number;
    
    @Prop()
    summoner2Id: number;
    
    @Prop()
    teamPosition: string;
    
    @Prop()
    totalAllyJungleMinionsKilled: number;
    
    @Prop()
    totalDamageDealt: number;
    
    @Prop()
    totalDamageDealtToChampions: number;
    
    @Prop()
    totalDamageShieldedOnTeammates: number;
    
    @Prop()
    totalDamageTaken: number;
    
    @Prop()
    totalEnemyJungleMinionsKilled: number;
    
    @Prop()
    totalHeal: number;
    
    @Prop()
    totalHealsOnTeammates: number;
    
    @Prop()
    totalMinionsKilled: number;
    
    @Prop()
    trueDamageDealt: number;
    
    @Prop()
    trueDamageDealtToChampions: number;
    
    @Prop()
    trueDamageTaken: number;
    
    @Prop()
    visionScore: number;
    
    @Prop()
    wardsKilled: number;
    
    @Prop()
    wardsPlaced: number;
}

const ParticipantSchema = SchemaFactory.createForClass(ParticipantData);

@Schema({_id: false})
export class ObjectiveData {
    @Prop()
    objectName: string;

    @Prop()
    first: boolean;

    @Prop()
    kills: number;
}

const ObjectiveSchema = SchemaFactory.createForClass(ObjectiveData);

@Schema({_id : false})
class TeamData {
    @Prop()
    teamId: number;

    @Prop()
    win: boolean;

    @Prop()
    bans: number[];

    @Prop({ type: [ObjectiveSchema] })
    objectives: ObjectiveData[];
}

const TeamSchema = SchemaFactory.createForClass(TeamData);

@Schema()
export class MatchData {
    @Prop({ unique: true })
    matchId: string;

    @Prop()
    gameCreation: Date;
    
    @Prop()
    gameDuration: number;
    
    @Prop()
    gameMode: string;
    
    @Prop()
    mapId: number;

    @Prop()
    queue: number;

    @Prop({ type: [ParticipantSchema] })
    participants: ParticipantData[];

    @Prop({ type: [TeamSchema] })
    teams: TeamData[];
}

export const MatchDataSchema = SchemaFactory.createForClass(MatchData);