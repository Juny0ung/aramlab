import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserLolDataDocument = HydratedDocument<UserLolData>;

@Schema()
export class UserLolData {
    @Prop({ unique: true })
    userId: string;

    @Prop()
    lastMatch?: string;
}

export const UserLolDataSchema = SchemaFactory.createForClass(UserLolData);