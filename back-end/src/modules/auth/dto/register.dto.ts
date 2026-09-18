import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AppRole } from '../../rbac/role.enum';

export class RegisterDto {
  @ApiProperty({ minLength: 3, maxLength: 30, example: 'player01' })
  @IsString()
  @Length(3, 30)
  username!: string;

  @ApiProperty({ example: 'player01@gameunity.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 100, example: 'Demo@123' })
  @IsString()
  @Length(8, 100)
  password!: string;

  @ApiPropertyOptional({ enum: AppRole, example: AppRole.USER })
  @IsOptional()
  @IsEnum(AppRole)
  role?: AppRole;

  @ApiPropertyOptional({ example: 'Player' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'May be empty for single-word full names', example: 'One' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
