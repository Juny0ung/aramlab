import { Injectable, } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MatchDto } from './dto/lol-match.dto';
import { LolDataSyncPort } from './ports/lol-data-sync.port';
import { Sleep } from 'src/common/sleep.util';

@Injectable()
export class LolSyncService implements LolDataSyncPort {
    private apiurl: string = 'https://asia.api.riotgames.com/';

    private starttime: number;

    constructor(private readonly httpService: HttpService) {
        const startDate = new Date('2025-01-01T00:00:00Z');
        this.starttime = Math.floor(startDate.getTime() / 1000);
    }

    async getPuuid(nickname: string, tag: string): Promise<string> {
        const url = this.apiurl + `riot/account/v1/accounts/by-riot-id/${encodeURIComponent(nickname)}/${encodeURIComponent(tag)}?api_key=${process.env.LOL_API_KEY}`;
        
        console.log('[LolSync]\ttry to find puuid for %s#%s', nickname, tag);

        const result = await this.CallRiotAPIWithRateLimit<string>(async () => {
            const result = await firstValueFrom(this.httpService.get(url));
            return result.data?.puuid ?? '';
        });

        return result ?? '';
    }

    async getMatches(puuid: string, queue: number, page: number): Promise<string[]> {
        console.log('try to find %s matches of %s in page %d', queue === 450 ? 'aram' : 'normal', puuid, page);

        const url = this.apiurl + `lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?starttime=${this.starttime}&queue=${queue}&start=${page * 100}&count=100&api_key=${process.env.LOL_API_KEY}`;
        const result = await this.CallRiotAPIWithRateLimit<string[]>(async () => {
            const response = await firstValueFrom(this.httpService.get<string[]>(url));
            let responseNum: number = 0;
            if (response.data) {
                responseNum = response.data.length;
            }
            console.log('[LolSync]\tfind %d matches', responseNum);
            return response.data?? [];
        });

        return result?? [];
    }

    async getMatchInfo(matchid: string): Promise<MatchDto | null> {
        console.log('[LolSync]\ttry to find match info for %s', matchid);
        const url = this.apiurl + `lol/match/v5/matches/${matchid}?api_key=${process.env.LOL_API_KEY}`;

        return await this.CallRiotAPIWithRateLimit<MatchDto | null>(async () => {
            const result = await firstValueFrom(this.httpService.get<MatchDto>(url));
            console.log('\t\tfind match data');
            return result.data ?? null;
        });
    }

    private async CallRiotAPIWithRateLimit<T>(
        Call: () => Promise<T>,
    ): Promise<T | null> {
        const maxRetry = 10;

        for (let i = 0; i < maxRetry; i++) {
            try {
                return await Call();
            } catch (error: any) {
                const status = error?.response?.status;
                if (status === 429) {
                    const delayMs = 120000 * (i + 1);
                    console.log('[LolSync]\twait for rate limit : %d', delayMs);
                    await Sleep(delayMs);
                    continue;
                } else if (status === 401) {
                    console.log('[LolSync]\tinvalid api key');
                    break;
                } else if (status === 404) {
                    console.log('[LolSync]\tdata not found');
                    break;
                }

                throw error;
            }
        }

        return null;
    }
}
