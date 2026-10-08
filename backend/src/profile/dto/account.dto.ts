import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
    @ApiProperty()
    currentPassword!: string;

    @ApiProperty()
    newPassword!: string;
}

export class ChangeEmailDto {
    @ApiProperty()
    currentPassword!: string;

    @ApiProperty()
    newEmail!: string;
}

export class EmailDto {
    @ApiProperty()
    email!: string;
}

export class SettingsDto {
    @ApiProperty()
    hideOnlineStatus!: boolean;
}

export class CloseAccountDto {
    @ApiProperty()
    currentPassword!: string;
}