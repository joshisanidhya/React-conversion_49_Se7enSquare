import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { OrganisersController } from './organisers.controller';
import { OrganisersService } from './organisers.service';

@Module({
  imports: [PaymentsModule, UsersModule],
  controllers: [OrganisersController],
  providers: [OrganisersService],
  exports: [OrganisersService],
})
export class OrganisersModule {}
