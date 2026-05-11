import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { Table, TableStatus } from '../tables/table.entity';
import { LockService } from '../redis/lock.service';
import { ClientProxy } from '@nestjs/microservices';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    @Inject('BOOKING_SERVICE')
    private readonly client: ClientProxy,
    private readonly lockService: LockService,
    private readonly eventsGateway: EventsGateway,
    private dataSource: DataSource,
  ) {}

  async createBookingRequest(data: CreateBookingDto) {
    // Check if device already has a confirmed booking
    if (!data.deviceId) {
      throw new BadRequestException('DeviceId is required');
    }
    const existingBooking = await this.bookingsRepository.findOne({
      where: { deviceId: data.deviceId, status: BookingStatus.CONFIRMED },
    });

    if (existingBooking) {
      throw new BadRequestException('คุณมีการจองโต๊ะที่ยืนยันแล้วอยู่แล้ว 1 โต๊ะ ไม่สามารถจองเพิ่มได้');
    }

    // 1. Try to acquire Redis Lock
    const lockKey = `table_${data.tableId}`;
    const lockValue = await this.lockService.acquireLock(lockKey, 60000); // 1 minute lock

    if (!lockValue) {
      throw new BadRequestException('Table is currently being booked by another user.');
    }

    // 2. Send to Queue
    this.client.emit('booking_created', { ...data, lockValue });

    return {
      message: 'Booking request received and is being processed.',
      status: 'pending',
    };
  }

  async processBooking(data: CreateBookingDto & { lockValue: string }) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Pessimistic Locking at Database Level
      const table = await queryRunner.manager.findOne(Table, {
        where: { id: data.tableId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!table || table.status !== TableStatus.AVAILABLE) {
        throw new Error('Table is no longer available.');
      }

      // 4. Create Booking
      const booking = new Booking();
      booking.bookingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      booking.table = table;
      booking.customerName = data.customerName;
      booking.deviceId = data.deviceId;
      booking.startTime = data.startTime;
      booking.endTime = data.endTime;
      booking.status = BookingStatus.CONFIRMED;

      await queryRunner.manager.save(booking);

      // 5. Update Table Status
      table.status = TableStatus.RESERVED;
      await queryRunner.manager.save(table);

      await queryRunner.commitTransaction();

      console.log(`Booking ${booking.bookingCode} confirmed for Table ${table.number}`);
      
      // 6. Broadcast updates
      this.eventsGateway.broadcastTableUpdate(table.id, table.status);
      this.eventsGateway.broadcastBookingConfirmed(booking);

      // Release lock after DB success
      await this.lockService.releaseLock(`table_${data.tableId}`, data.lockValue);

      return booking;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Booking processing failed:', err.message);
      
      // Release lock on failure
      await this.lockService.releaseLock(`table_${data.tableId}`, data.lockValue);
      
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelBooking(bookingId: number, deviceId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, deviceId },
      relations: ['table'],
    });

    if (!booking) {
      throw new BadRequestException('ไม่พบข้อมูลการจอง หรือคุณไม่มีสิทธิ์ยกเลิกการจองนี้');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('การจองนี้ถูกยกเลิกไปแล้ว');
    }

    const table = booking.table;
    
    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    await this.bookingsRepository.save(booking);

    // Update table status
    table.status = TableStatus.AVAILABLE;
    await this.tablesRepository.save(table);

    // Notify via WebSockets
    this.eventsGateway.server.emit('table_updated', {
      tableId: table.id,
      status: TableStatus.AVAILABLE,
    });

    return { message: 'ยกเลิกการจองสำเร็จ' };
  }
}
