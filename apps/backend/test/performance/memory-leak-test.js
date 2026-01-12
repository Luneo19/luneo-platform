/**
 * Memory Leak Test
 * Tests for memory leaks over time
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const DURATION = 5 * 60 * 1000; // 5 minutes
const INTERVAL = 1000; // 1 second

let requestCount = 0;
let errorCount = 0;
const memoryUsage = [];

function makeRequest() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    http.get(`${BASE_URL}/health`, (res) => {
      const duration = Date.now() - startTime;
      
      res.on('data', () => {});
      res.on('end', () => {
        requestCount++;
        if (res.statusCode !== 200) {
          errorCount++;
        }
        resolve({ status: res.statusCode, duration });
      });
    }).on('error', (err) => {
      errorCount++;
      reject(err);
    });
  });
}

async function runTest() {
  console.log('Starting memory leak test...');
  console.log(`Duration: ${DURATION / 1000}s`);
  console.log(`Interval: ${INTERVAL}ms`);
  
  const startTime = Date.now();
  const interval = setInterval(async () => {
    try {
      await makeRequest();
      
      // Record memory usage every 10 seconds
      if (requestCount % 10 === 0) {
        const memUsage = process.memoryUsage();
        memoryUsage.push({
          timestamp: Date.now() - startTime,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
        });
        
        console.log(`Requests: ${requestCount}, Errors: ${errorCount}, Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Check for memory leak (heap should not grow continuously)
      if (memoryUsage.length > 10) {
        const recent = memoryUsage.slice(-10);
        const first = recent[0].heapUsed;
        const last = recent[recent.length - 1].heapUsed;
        const growth = ((last - first) / first) * 100;
        
        if (growth > 50) {
          console.warn(`⚠️ Potential memory leak detected: ${growth.toFixed(2)}% growth`);
        }
      }
    } catch (error) {
      console.error('Request error:', error.message);
    }
    
    // Stop after duration
    if (Date.now() - startTime >= DURATION) {
      clearInterval(interval);
      console.log('\nTest completed!');
      console.log(`Total requests: ${requestCount}`);
      console.log(`Total errors: ${errorCount}`);
      console.log(`Error rate: ${((errorCount / requestCount) * 100).toFixed(2)}%`);
      
      // Analyze memory usage
      if (memoryUsage.length > 0) {
        const firstMem = memoryUsage[0];
        const lastMem = memoryUsage[memoryUsage.length - 1];
        const memGrowth = ((lastMem.heapUsed - firstMem.heapUsed) / firstMem.heapUsed) * 100;
        console.log(`Memory growth: ${memGrowth.toFixed(2)}%`);
        
        if (memGrowth > 20) {
          console.warn('⚠️ Significant memory growth detected - possible memory leak');
        } else {
          console.log('✅ No significant memory leak detected');
        }
      }
      
      process.exit(0);
    }
  }, INTERVAL);
}

runTest().catch(console.error);
