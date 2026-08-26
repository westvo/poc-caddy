import { Controller, Get } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as os from 'os';

@Controller('performance')
export class PerformanceController {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: '222.255.214.97', // connect via host IP
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

      // Server stats
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = (usedMem / totalMem) * 100;
      
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      return {
        success: true,
        data: {
          tableCount,
          totalRows,
          sampleDataCount: sampleData.length,
          metrics: {
            dbReadTimeMs: readTime,
            totalApiTimeMs: end - start,
          },
          server: {
            cpuCount: cpus.length,
            cpuModel: cpus[0]?.model,
            loadAvg1m: loadAvg[0],
            loadAvg5m: loadAvg[1],
            loadAvg15m: loadAvg[2],
            totalMemBytes: totalMem,
            usedMemBytes: usedMem,
            freeMemBytes: freeMem,
            memUsagePercent: memUsagePercent
          }
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Get('stress-test')
  async runStressTest() {
    try {
      const start = performance.now();
      const numQueries = 1000;
      
      const queryPromises = [];
      for (let i = 0; i < numQueries; i++) {
        // Randomly query one of the 700 generated tables to prevent caching
        const tableId = Math.floor(Math.random() * 700) + 1;
        queryPromises.push(this.pool.query(`SELECT id, k, c, pad FROM sbtest${tableId} ORDER BY RAND() LIMIT 1`));
      }
      
      const results = await Promise.allSettled(queryPromises);
      const end = performance.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      return {
        success: true,
        data: {
          totalRequests: numQueries,
          successfulRequests: successful,
          failedRequests: failed,
          totalTimeMs: end - start,
          throughputRps: (successful / ((end - start) / 1000))
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
