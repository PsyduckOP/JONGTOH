import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

@Entity()
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: string;

  @Column()
  capacity: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;
}
