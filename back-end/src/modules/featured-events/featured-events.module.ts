import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { FeaturedEventsController } from './featured-events.controller';
import { FeaturedEventsService } from './featured-events.service';

@Module({
  imports: [PaymentsModule],
  controllers: [FeaturedEventsController],
  providers: [FeaturedEventsService],
  exports: [FeaturedEventsService],
})
export class FeaturedEventsModule {}
