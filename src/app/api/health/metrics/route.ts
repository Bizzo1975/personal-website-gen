import { NextRequest, NextResponse } from 'next/server';

// Health metrics in Prometheus format
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Perform health checks
    const healthChecks = await performHealthChecks();
    
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;
    
    // Generate Prometheus metrics
    const metrics = generateHealthMetrics(healthChecks, responseTime);
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating health metrics:', error);
    
    const errorMetrics = `
# HELP health_check_up Health check status (1 = healthy, 0 = unhealthy)
# TYPE health_check_up gauge
health_check_up{service="application"} 0

# HELP health_check_duration_seconds Time taken to perform health checks
# TYPE health_check_duration_seconds gauge
health_check_duration_seconds 0

# HELP health_check_errors_total Total number of health check errors
# TYPE health_check_errors_total counter
health_check_errors_total 1
`.trim();

    return new NextResponse(errorMetrics, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  }
}

async function performHealthChecks() {
  const checks = {
    application: true,
    database: true,
    cache: true,
    filesystem: true,
    memory: true,
    cpu: true,
  };

  try {
    // Application health check
    checks.application = await checkApplication();
    
    // Database health check
    checks.database = await checkDatabase();
    
    // Cache health check (Redis)
    checks.cache = await checkCache();
    
    // Filesystem health check
    checks.filesystem = await checkFilesystem();
    
    // Memory health check
    checks.memory = await checkMemory();
    
    // CPU health check
    checks.cpu = await checkCPU();
    
  } catch (error) {
    console.error('Health check error:', error);
  }

  return checks;
}

async function checkApplication(): Promise<boolean> {
  try {
    // Check if the application is responding
    // This could include checking critical services, APIs, etc.
    return true;
  } catch (error) {
    console.error('Application health check failed:', error);
    return false;
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    // In a real implementation, you would check database connectivity
    // Example: await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkCache(): Promise<boolean> {
  try {
    // In a real implementation, you would check Redis connectivity
    // Example: await redis.ping();
    return true;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
}

async function checkFilesystem(): Promise<boolean> {
  try {
    // Check filesystem health (disk space, write permissions, etc.)
    const fs = require('fs').promises;
    await fs.access('/tmp', fs.constants.W_OK);
    return true;
  } catch (error) {
    console.error('Filesystem health check failed:', error);
    return false;
  }
}

async function checkMemory(): Promise<boolean> {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    
    // Consider unhealthy if heap usage is above 90%
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    return memoryUsagePercent < 90;
  } catch (error) {
    console.error('Memory health check failed:', error);
    return false;
  }
}

async function checkCPU(): Promise<boolean> {
  try {
    // Simple CPU health check - in production you might want more sophisticated checks
    const cpuUsage = process.cpuUsage();
    return true; // For now, always return true
  } catch (error) {
    console.error('CPU health check failed:', error);
    return false;
  }
}

function generateHealthMetrics(healthChecks: Record<string, boolean>, responseTime: number): string {
  const timestamp = Date.now();
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const rssUsedMB = memoryUsage.rss / 1024 / 1024;
  
  let metrics = `# HELP health_check_up Health check status (1 = healthy, 0 = unhealthy)
# TYPE health_check_up gauge
`;

  // Add health check metrics for each service
  Object.entries(healthChecks).forEach(([service, isHealthy]) => {
    metrics += `health_check_up{service="${service}"} ${isHealthy ? 1 : 0}\n`;
  });

  metrics += `
# HELP health_check_duration_seconds Time taken to perform health checks
# TYPE health_check_duration_seconds gauge
health_check_duration_seconds ${responseTime}

# HELP health_check_timestamp_seconds Timestamp of the last health check
# TYPE health_check_timestamp_seconds gauge
health_check_timestamp_seconds ${timestamp / 1000}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${uptime}

# HELP nodejs_heap_used_bytes Node.js heap memory used in bytes
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${memoryUsage.heapUsed}

# HELP nodejs_heap_total_bytes Node.js heap memory total in bytes
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${memoryUsage.heapTotal}

# HELP nodejs_rss_bytes Node.js RSS memory in bytes
# TYPE nodejs_rss_bytes gauge
nodejs_rss_bytes ${memoryUsage.rss}

# HELP nodejs_external_bytes Node.js external memory in bytes
# TYPE nodejs_external_bytes gauge
nodejs_external_bytes ${memoryUsage.external}

# HELP nodejs_memory_usage_percent Node.js memory usage percentage
# TYPE nodejs_memory_usage_percent gauge
nodejs_memory_usage_percent ${(heapUsedMB / heapTotalMB) * 100}

# HELP health_check_overall_status Overall health status (1 = all healthy, 0 = at least one unhealthy)
# TYPE health_check_overall_status gauge
health_check_overall_status ${Object.values(healthChecks).every(Boolean) ? 1 : 0}
`;

  return metrics.trim();
} 
