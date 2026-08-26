import { Controller, Get } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Controller('performance')
export class PerformanceController {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: 'mysql', // docker-compose service name
      user: 'root',
      password: 'root',
      database: 'test_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  @Get('dashboard')
  async getDashboard() {
    try {
      const start = performance.now();
      
      // Get table count
      const [tables]: any = await this.pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'test_db'");
      const tableCount = tables[0].count;

      // Measure performance on a simple read
      const readStart = performance.now();
      const [sampleData]: any = await this.pool.query("SELECT * FROM sbtest1 LIMIT 50");
      const readTime = performance.now() - readStart;

      // Get total rows estimate
      const [rowsInfo]: any = await this.pool.query("SELECT SUM(TABLE_ROWS) as totalRows FROM information_schema.tables WHERE table_schema = 'test_db'");
      const totalRows = rowsInfo[0].totalRows;

      const end = performance.now();

      return {
        success: true,
        data: {
          tableCount,
          totalRows,
          sampleDataCount: sampleData.length,
          metrics: {
            dbReadTimeMs: readTime,
            totalApiTimeMs: end - start,
          }
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
