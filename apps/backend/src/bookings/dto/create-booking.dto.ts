import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: 'The ID of the table' })
  @IsNumber()
  @IsNotEmpty()
  tableId: number;

  @ApiProperty({ example: 'John Doe', description: 'Name of the customer' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '0812345678', description: 'Phone number of the customer' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email of the customer', required: false })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ example: 'Allergy to peanuts', description: 'Special requests', required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @ApiProperty({ example: 'uuid-123', description: 'Unique ID of the device' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ example: '2026-05-11T15:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({ example: '2026-05-11T16:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: Date;
}
