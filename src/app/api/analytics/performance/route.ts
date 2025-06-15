import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: string;
  url: string;
  userAgent: string;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();

    // Validate the metric data
    if (!metric.name || typeof metric.value !== 'number' || !metric.id) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Log the metric (in production, you'd store this in a database)
    console.log('Performance Metric:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: new Date(metric.timestamp).toISOString(),
      connection: metric.connection,
    });

    // Here you would typically:
    // 1. Store the metric in a database (MongoDB, PostgreSQL, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Trigger alerts for poor performance metrics
    // 4. Aggregate metrics for dashboards

    // Example database storage (uncomment when you have a database setup):
    /*
    await db.collection('performance_metrics').insertOne({
      ...metric,
      createdAt: new Date(),
      processed: false,
    });
    */

    // Example alert system for poor performance:
    if (metric.rating === 'poor') {
      console.warn(`Poor performance detected: ${metric.name} = ${metric.value} on ${metric.url}`);
      
      // You could send alerts here:
      // - Email notifications
      // - Slack webhooks
      // - PagerDuty alerts
      // - Custom monitoring systems
    }

    // Aggregate metrics for real-time monitoring
    const aggregatedData = {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: metric.timestamp,
      url: metric.url,
      userAgent: metric.userAgent.substring(0, 100), // Truncate for storage
      connection: metric.connection,
    };

    // Example: Store in Redis for real-time dashboards
    /*
    await redis.lpush('performance_metrics', JSON.stringify(aggregatedData));
    await redis.ltrim('performance_metrics', 0, 999); // Keep last 1000 metrics
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Metric recorded successfully',
      metric: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      }
    });

  } catch (error) {
    console.error('Error processing performance metric:', error);
    
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint could return aggregated performance data
    // for admin dashboards or monitoring tools
    
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const metric = url.searchParams.get('metric');

    // Example response structure
    const mockData = {
      timeframe,
      metrics: {
        lcp: {
          average: 2100,
          p95: 3200,
          samples: 150,
          rating: 'good',
        },
        fid: {
          average: 85,
          p95: 120,
          samples: 145,
          rating: 'good',
        },
        cls: {
          average: 0.08,
          p95: 0.15,
          samples: 148,
          rating: 'good',
        },
        fcp: {
          average: 1600,
          p95: 2400,
          samples: 152,
          rating: 'good',
        },
        ttfb: {
          average: 650,
          p95: 950,
          samples: 155,
          rating: 'good',
        },
      },
      trends: {
        improving: ['LCP', 'FCP'],
        stable: ['FID', 'CLS'],
        declining: [],
      },
      alerts: [],
    };

    // Filter by specific metric if requested
    if (metric && mockData.metrics[metric as keyof typeof mockData.metrics]) {
      return NextResponse.json({
        metric,
        data: mockData.metrics[metric as keyof typeof mockData.metrics],
        timeframe,
      });
    }

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Error fetching performance data:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
} 
