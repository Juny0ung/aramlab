import { MatchDataDocument } from "../schemas/matchdata.schema";
import { UserLolDataDocument } from "../schemas/userloldata.schema";

export const LOL_DATA_SERVICE = 'LOL_DATA_SERVICE';

export interface LolDataPort {
    getUserData(name: string, queue: number): Promise<UserLolDataDocument | null>;
    getMatches(name: string, queue: number, count: number, page: number): Promise<MatchDataDocument[]>;
    updateAllMatches(queue: number);
    updateAllUserLolData(queue: number);
}