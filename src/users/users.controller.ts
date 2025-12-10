import { Inject, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { USERS_SERVICE } from './ports/users.port';
import type { UsersPort } from './ports/users.port';
import { User } from './schemas/users.schema';

@Controller('users')
export class UsersController {
    constructor(@Inject(USERS_SERVICE) private readonly usersService: UsersPort) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        this.usersService.create(createUserDto);
    }

    @Get(':name')
    findOne(@Param('name') name: string): Promise<User | null> {
        return this.usersService.findOne(name);
    }

    @Get()
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }
}