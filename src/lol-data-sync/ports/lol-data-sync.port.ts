import { MatchInfoDto } from "../dto/lol-match.dto";

export const LOL_DATA_SYNC_SERVICE = 'LOL_DATA_SYNC_SERVICE';

export interface LolDataSyncPort {
    getPuuid(nickname: string, tag: string): Promise<string | null>;
    getMatches(puuid: string, queue: number, page: number): Promise<string[]>;
    getMatchInfo(matchid: string): Promise<MatchInfoDto | null>;
}