import { MatchDataDocument } from "../schemas/matchdata.schema";
import { UserLolDataDocument } from "../schemas/userloldata.schema";

export const LOL_DATA_SERVICE = 'LOL_DATA_SERVICE';

export interface LolDataPort {
    updateMatchesForUser(name: string, queue: number): Promise<MatchDataDocument[]>;
    updateUserLolData(name: string, queue: number): Promise<UserLolDataDocument | null>;
    getUserData(name: string, queue: number): Promise<UserLolDataDocument | null>;
}