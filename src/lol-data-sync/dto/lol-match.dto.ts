class PerkStatsDto {
    defense: number;
    flex: number;
    offense: number;
}

export class PerkStyleSelectionDto {
    perk: number;
    var1: number;
    var2: number;
    var3: number;
}

export class PerkStyleDto {
    description: string;
    selections: PerkStyleSelectionDto[];
    style: number;
}

class PerksDto {
    statPerks: PerkStatsDto;
    styles: PerkStyleDto[];
}

export class ParticipantDto {
    assists: number;
    champLevel: number;
    championId: number;
    championName: string;
    championTransform: number;
    damageDealtToBuildings: number;
    damageDealtToObjectives: number;
    damageDealtToTurrets: number;
    damageSelfMitigated: number;
    deaths: number;
    detectorWardsPlaced: number;
    doubleKills: number;
    dragonKills: number;
    firstBloodAssist: boolean;
    firstBloodKill: boolean;
    firstTowerAssist: boolean;
    firstTowerKill: boolean;
    gameEndedInSurrender: boolean;
    goldEarned: number;
    goldSpent: number;
    individualPosition: string;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    killingSprees: number;
    kills: number;
    lane: string;
    largestKillingSpree: number;
    largestMultiKill: number;
    longestTimeSpentLiving: number;
    magicDamageDealt: number;
    magicDamageDealtToChampions: number;
    magicDamageTaken: number;
    neutralMinionsKilled: number;
    objectivesStolen: number;
    objectivesStolenAssists: number;
    participantId: number;
    pentaKills: number;
    perks: PerksDto;
    physicalDamageDealt: number;
    physicalDamageDealtToChampions: number;
    physicalDamageTaken: number;
    puuid: string;
    quadraKills: number;
    role: string;
    sightWardsBoughtInGame: number;
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
    summoner1Id: number;
    summoner2Id: number;
    teamId: number;
    teamPosition: string;
    timePlayed: number;
    totalAllyJungleMinionsKilled: number;
    totalDamageDealt: number;
    totalDamageDealtToChampions: number;
    totalDamageShieldedOnTeammates: number;
    totalDamageTaken: number;
    totalEnemyJungleMinionsKilled: number;
    totalHeal: number;
    totalHealsOnTeammates: number;
    totalMinionsKilled: number;
    tripleKills: number;
    trueDamageDealt: number;
    trueDamageDealtToChampions: number;
    trueDamageTaken: number;
    visionScore: number;
    visionWardsBoughtInGame: number;
    wardsKilled: number;
    wardsPlaced: number;
    win: boolean;
}

class BanDto {
    championId: number;
    pickTurn: number;
}

class ObjectiveDto {
    first: boolean;
    kills: number;
}

class ObjectivesDto {
    baron: ObjectiveDto;
    champion: ObjectiveDto;
    dragon: ObjectiveDto;
    horde: ObjectiveDto;
    inhibitor: ObjectiveDto;
    riftHerald: ObjectiveDto;
    tower: ObjectiveDto;
}

export class TeamDto {
    bans: BanDto[];
    objectives: ObjectivesDto;
    teamId: number;
    win: boolean;    
}

class MatchInfoDto {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    mapId: number;
    queueId: number;
    participants: ParticipantDto[];
    teams: TeamDto[];
}

class MetadataDto {
    dataVersion: string;
    matchId: string;
}

export class MatchDto {
    metadata: MetadataDto;
    info: MatchInfoDto;
}