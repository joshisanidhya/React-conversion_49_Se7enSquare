import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { AppRole } from '../../rbac/role.enum';

export class LoginDto {
  @ApiProperty({ description: 'Email or username', example: 'player01' })
  @IsString()
  @Length(1, 100)
  login!: string;

  @ApiProperty({ example: 'Demo@123' })
  @IsString()
  @Length(1, 100)
  password!: string;

  @ApiPropertyOptional({ enum: AppRole, example: AppRole.USER })
  @IsOptional()
  @IsEnum(AppRole)
  role?: AppRole;
}
