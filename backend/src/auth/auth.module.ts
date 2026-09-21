import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [DatabaseModule,
        JwtModule.register({})],
    controllers: [AuthController],
    providers: [AuthService]
})

export class AuthModule { }