import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TablesService } from './tables/tables.service';
import { TableStatus } from './tables/table.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(private readonly tablesService: TablesService) {}

  async onApplicationBootstrap() {
    try {
      const tables = await this.tablesService.findAll();
      if (tables.length === 0) {
        console.log('Seeding initial tables...');
        for (let i = 1; i <= 6; i++) {
          await this.tablesService.create({
            number: i.toString(),
            capacity: i % 2 === 0 ? 4 : 2,
            status: TableStatus.AVAILABLE,
          });
        }
        console.log('Seeding completed.');
      }
    } catch (error) {
      console.error('Seed process failed. This might be due to database connection issues.', error.message);
    }
  }
}
