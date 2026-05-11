import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table, TableStatus } from './table.entity';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
  ) {}

  async findAll(): Promise<Table[]> {
    return this.tablesRepository.find();
  }

  async findOne(id: number): Promise<Table | null> {
    return this.tablesRepository.findOne({ where: { id } });
  }

  async updateStatus(id: number, status: TableStatus): Promise<Table> {
    const table = await this.findOne(id);
    if (!table) throw new Error('Table not found');
    table.status = status;
    return this.tablesRepository.save(table);
  }

  async resetTable(id: number): Promise<Table> {
    return this.updateStatus(id, TableStatus.AVAILABLE);
  }

  async create(table: Partial<Table>): Promise<Table> {
    const newTable = this.tablesRepository.create(table);
    return this.tablesRepository.save(newTable);
  }
}
