import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LOL_DATA_SYNC_SERVICE } from 'src/lol-data-sync/ports/lol-data-sync.port';
import type { LolDataSyncPort } from 'src/lol-data-sync/ports/lol-data-sync.port';
import { UsersPort } from './ports/users.port';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class UsersService implements UsersPort {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject(LOL_DATA_SYNC_SERVICE) private readonly lolSyncService: LolDataSyncPort
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserInfoDto | null> {
        console.log('[User]\ttry to create user %s', createUserDto.name);
        const puuid = await this.lolSyncService.getPuuid(createUserDto.nickname, createUserDto.tag);
        if (puuid === null)
        {
            console.log('[User]\tcannot find account for %s#%s', createUserDto.nickname, createUserDto.tag);
            return null;
        }

        try {
            const createdUser = new this.userModel({ 
                name: createUserDto.name,
                puuid: puuid
            });
            console.log('[User]\tuser create success: %s (%s)', createUserDto.name, puuid);
            await createdUser.save();
            return {
                id: createdUser._id.toString(),
                name: createdUser.name,
                puuid: createdUser.puuid
            };
        }
        catch (e: any) {
            if (e?.code === 11000) {
                if (e?.keyPattern?.name) {
                    console.log('[User]\talready existed name');
                }
                else if (e?.keyPattern?.puuid) {
                    console.log('[User]\talready existed account');
                }
            }
            else {
                console.log('error');
            }
            return null;
        }
    }

    async findOne(name: string): Promise<UserInfoDto | null> {
        const user = await this.userModel.findOne({
            name: name
        }).exec();

        if (!user) {
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
