import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ unique: true })
    name: string;

    @Prop({ unique: true })
    puuid: string;
}

export const UserSchema = SchemaFactory.createForClass(User);