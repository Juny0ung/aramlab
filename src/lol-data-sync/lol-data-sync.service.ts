import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MatchDto } from './dto/lol-match.dto';
import { LolDataSyncPort } from './ports/lol-data-sync.port';
import { Sleep } from 'src/common/sleep.util';

@Injectable()
export class LolSyncService implements LolDataSyncPort {
    private readonly apiurl: string = 'https://asia.api.riotgames.com/';

    private readonly starttime: number;

    private readonly logger = new Logger(LolSyncService.name); 

    constructor(private readonly httpService: HttpService) {
        const startDate = new Date('2025-01-01T00:00:00Z');
        this.starttime = Math.floor(startDate.getTime() / 1000);
    }

    async getPuuid(nickname: string, tag: string): Promise<string> {
        const url = this.apiurl + `riot/account/v1/accounts/by-riot-id/${encodeURIComponent(nickname)}/${encodeURIComponent(tag)}?api_key=${process.env.LOL_API_KEY}`;
        
        this.logger.log('[1] find puuid for %s#%s', nickname, tag);

        const result = await this.CallRiotAPIWithRateLimit<string>(async () => {
            const result = await firstValueFrom(this.httpService.get(url));
            if (result.data?.puuid) {
                this.logger.log('[2] find puuid success');
            } else {
                this.logger.warn('[2] find puuid fail');
            }
            return result.data?.puuid ?? '';
        });

        return result ?? '';
    }

    async getMatches(puuid: string, queue: number, page: number): Promise<string[]> {
        this.logger.log('[1] find 100 matches (%s) of %s in page %d', queue === 450 ? 'aram' : 'normal', puuid, page);

        const url = this.apiurl + `lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?starttime=${this.starttime}&queue=${queue}&start=${page * 100}&count=100&api_key=${process.env.LOL_API_KEY}`;
        const result = await this.CallRiotAPIWithRateLimit<string[]>(async () => {
            const response = await firstValueFrom(this.httpService.get<string[]>(url));
            let responseNum: number = 0;
            if (response.data) {
                responseNum = response.data.length;
            }
            this.logger.log('[2] find %d matches', responseNum);
            return response.data?? [];
        });

        return result?? [];
    }

    async getMatchInfo(matchid: string): Promise<MatchDto | null> {
        this.logger.log('[1] find match [%s] info', matchid);
        const url = this.apiurl + `lol/match/v5/matches/${matchid}?api_key=${process.env.LOL_API_KEY}`;

        return await this.CallRiotAPIWithRateLimit<MatchDto | null>(async () => {
            const result = await firstValueFrom(this.httpService.get<MatchDto>(url));
            if (result.data) {
                this.logger.log('[2] find match info success');
            } else {
                this.logger.warn('[2] find match info fail');
            }
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
                    this.logger.log('\twait for rate limit : %d', delayMs);
                    await Sleep(delayMs);
                    continue;
                } else if (status === 401) {
                    this.logger.warn('\tinvalid api key');
                    break;
                } else if (status === 404) {
                    this.logger.warn('\tdata not found');
                    break;
                }

                throw error;
            }
        }

        return null;
    }
}
