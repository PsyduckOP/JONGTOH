import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { Table } from './table.entity';

@ApiTags('tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables and their current status' })
  @ApiResponse({ status: 200, description: 'List of all tables returned.' })
  async findAll(): Promise<Table[]> {
    return this.tablesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({ status: 201, description: 'Table created successfully.' })
  async create(@Body() tableData: Partial<Table>): Promise<Table> {
    return this.tablesService.create(tableData);
  }

  @Post(':id/clear')
  @ApiOperation({ summary: 'Force clear a table status to Available' })
  @ApiResponse({ status: 200, description: 'Table reset to available.' })
  async clear(@Param('id') id: number): Promise<Table> {
    return this.tablesService.resetTable(id);
  }
}
