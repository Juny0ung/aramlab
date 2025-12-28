import { Model } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LOL_DATA_SYNC_SERVICE } from 'src/lol-data-sync/ports/lol-data-sync.port';
import type { LolDataSyncPort } from 'src/lol-data-sync/ports/lol-data-sync.port';
import { UsersPort } from './ports/users.port';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class UsersService implements UsersPort {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserInfoDto | null> {
        this.logger.log('[1] start create user %s', createUserDto.name);
        const puuid = await this.lolSyncService.getPuuid(createUserDto.nickname, createUserDto.tag);
        if (puuid === null)
        {
            this.logger.warn('[2] create user fail\n\tcannot find account for %s#%s', createUserDto.nickname, createUserDto.tag);
            return null;
        }

        try {
            const createdUser = new this.userModel({ 
                name: createUserDto.name,
                puuid: puuid
            });
            await createdUser.save();
            this.logger.log('[2] user create success: %s (puuid: %s)', createUserDto.name, puuid);
            return {
                id: createdUser._id.toString(),
                name: createdUser.name,
                puuid: createdUser.puuid
            };
        }
        catch (e: any) {
            if (e?.code === 11000) {
                if (e?.keyPattern?.name) {
                    this.logger.warn('[2] already existed name: %s', createUserDto.name);
                }
                else if (e?.keyPattern?.puuid) {
                    this.logger.warn('[2] already existed account: %s#%s', createUserDto.nickname, createUserDto.tag);
                }
            }
            else {
                this.logger.warn('[2] unknown error(%d)', e?.code);
            }
            return null;
        }
    }

    async findOne(name: string): Promise<UserInfoDto | null> {
        const user = await this.userModel.findOne({
            name: name
        }).exec();

        if (!user) {
            this.logger.warn('\tno user %s', name);
            return null;
        }

        return this.convertDocumentToDto(user);
    }

    async findAll(): Promise<UserInfoDto[]> {
        const users = await this.userModel.find().exec();
        return users.map((userDocument: UserDocument) => {
            return this.convertDocumentToDto(userDocument);
        });
    }

    async findOneBypuuid(puuid: string): Promise<UserInfoDto | null> {
        const user = await this.userModel.findOne({
            puuid: puuid
        }).exec();

        if (!user) {
            this.logger.warn('\tno user for puuid %s', puuid);
            return null;
        }

        return this.convertDocumentToDto(user);
    }

    convertDocumentToDto(userDocument: UserDocument): UserInfoDto {
        const userDto = new UserInfoDto();
        userDto.id = userDocument._id.toString();
        userDto.name = userDocument.name;
        userDto.puuid = userDocument.puuid;
        return userDto;
    }
}
