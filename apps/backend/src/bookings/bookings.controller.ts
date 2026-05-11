import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a new table booking' })
  @ApiResponse({ status: 201, description: 'Booking request received and queued.' })
  @ApiResponse({ status: 400, description: 'Invalid data or table already locked.' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createBookingRequest(createBookingDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an existing booking' })
  async cancel(
    @Param('id') id: number,
    @Body('deviceId') deviceId: string
  ) {
    return this.bookingsService.cancelBooking(id, deviceId);
  }

  @EventPattern('booking_created')
  async handleBookingCreated(@Payload() data: any) {
    await this.bookingsService.processBooking(data);
  }
}
