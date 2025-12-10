import { Injectable, } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MatchDto, MatchInfoDto } from './dto/lol-match.dto';
import { LolDataSyncPort } from './ports/lol-data-sync.port';

@Injectable()
export class LolSyncService implements LolDataSyncPort {
    private apiurl: string = 'https://asia.api.riotgames.com/';

    private starttime: number;

    constructor(private readonly httpService: HttpService) {
        const startDate = new Date('2025-01-01T00:00:00Z');
        this.starttime = Math.floor(startDate.getTime() / 1000);
    }

    async getPuuid(nickname: string, tag: string): Promise<string | null> {
        const url = this.apiurl + `riot/account/v1/accounts/by-riot-id/${encodeURIComponent(nickname)}/${encodeURIComponent(tag)}?api_key=${process.env.LOL_API_KEY}`;
        
        console.log('try to find puuid for %s#%s', nickname, tag);

        try {
            const result = await firstValueFrom(this.httpService.get(url));
            return result.data?.puuid ?? null;
        } catch (e: any) {
            switch(e.code) {
                case 404:
                    console.log('no account');
                    break;
                case 401:
                    console.log('invalid api key');
                    break;
                default:
                    console.log('error');
                    break;
            }
            return null;
        }
    }

    async getMatches(puuid: string, queue: number, page: number): Promise<string[]> {
        console.log('try to find %s matches of %s in page %d', queue === 450 ? 'aram' : 'normal', puuid, page);

        const url = this.apiurl + `lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?starttime=${this.starttime}&queue=${queue}&start=${page * 100}&count=100&api_key=${process.env.LOL_API_KEY}`;
        try {
            const response = await firstValueFrom(this.httpService.get<string[]>(url));
            let responseNum: number = 0;
            if (response.data) {
                responseNum = response.data.length;
            }
            console.log('find %d matches', responseNum);
            return response.data?? [];
        } catch (e: any) {
            switch(e.code) {
                case 404:
                    console.log('no account');
                    break;
                case 401:
                    console.log('invalid api key');
                    break;
                default:
                    console.log('error');
                    break;
            }
            return [];
        }
    }

    async getMatchInfo(matchid: string): Promise<MatchInfoDto | null> {
        console.log('try to find match info for %s', matchid);
        const url = this.apiurl + `lol/match/v5/matches/${matchid}?api_key=${process.env.LOL_API_KEY}`;

        try {
            const result = await firstValueFrom(this.httpService.get<MatchDto>(url));
            console.log('find match data');
            return result.data?.info ?? null;
        } catch (e: any) {
            switch(e.code) {
                case 404:
                    console.log('no match');
                    break;
                case 401:
                    console.log('invalid api key');
                    break;
                default:
                    console.log('error!');
                    break;
            }
            return null;
        }
    }
}
