import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ModeratorCertificationController } from './moderator-certification.controller';
import { ModeratorCertificationService } from './moderator-certification.service';

@Module({
  imports: [UsersModule],
  controllers: [ModeratorCertificationController],
  providers: [ModeratorCertificationService],
  exports: [ModeratorCertificationService],
})
export class ModeratorCertificationModule {}
