import { UserInfoDto } from "../dto/user-info.dto";
import { CreateUserDto } from "../dto/create-user.dto";

export const USERS_SERVICE = 'USERS_SERVICE';

export interface UsersPort {
  create(createUserDto: CreateUserDto): Promise<UserInfoDto | null>;
  findOne(name: string): Promise<UserInfoDto | null>;
  findOneBypuuid(puuid: string): Promise<UserInfoDto | null>;
  findAll(): Promise<UserInfoDto[]>; 
}