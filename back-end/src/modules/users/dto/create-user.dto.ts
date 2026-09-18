import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AppRole } from '../../rbac/role.enum';

export class CreateUserDto {
  @ApiProperty({ minLength: 3, maxLength: 30, example: 'newplayer' })
  @IsString()
  @Length(3, 30)
  username!: string;

  @ApiProperty({ example: 'newplayer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AppRole, example: AppRole.USER })
  @IsEnum(AppRole)
  role!: AppRole;

  @ApiPropertyOptional({ minLength: 5, maxLength: 160, example: 'Loves MMORPG and FPS.' })
  @IsOptional()
  @IsString()
  @Length(5, 160)
  bio?: string;

  @ApiPropertyOptional({ example: 'Alex' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'May be empty for single-word full names', example: 'Morgan' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '/uploads/1234-avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  avatar?: string;
}
