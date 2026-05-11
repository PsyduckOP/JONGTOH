import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './booking.entity';
import { Table } from '../tables/table.entity';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Table]),
    TablesModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule {}
