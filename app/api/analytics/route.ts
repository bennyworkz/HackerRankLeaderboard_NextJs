import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsData {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  event: string;
  contestSlug?: string;
  timestamp: number;
  userAgent?: string;
}

// In-memory storage (for demo - use a real database in production)
const analytics: AnalyticsData[] = [];
const activeUsers = new Map<string, number>(); // ip -> last seen timestamp

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Get location from Vercel headers
    const country = request.headers.get('x-vercel-ip-country') || undefined;
    const city = request.headers.get('x-vercel-ip-city') || undefined;
    const region = request.headers.get('x-vercel-ip-country-region') || undefined;
    
    const analyticsData: AnalyticsData = {
      ip,
      country,
      city,
      region,
      event: body.event,
      contestSlug: body.contestSlug,
      timestamp: body.timestamp || Date.now(),
      userAgent: body.userAgent,
    };
    
    // Store analytics data
    analytics.push(analyticsData);
    
    // Update active users
    activeUsers.set(ip, Date.now());
    
    // Clean up inactive users (not seen in last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [userIp, lastSeen] of activeUsers.entries()) {
      if (lastSeen < fiveMinutesAgo) {
        activeUsers.delete(userIp);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'stats') {
      // Calculate statistics
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      // Clean up old active users
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      for (const [userIp, lastSeen] of activeUsers.entries()) {
        if (lastSeen < fiveMinutesAgo) {
          activeUsers.delete(userIp);
        }
      }
      
      const todayEvents = analytics.filter(a => a.timestamp >= oneDayAgo);
      const todayUniqueUsers = new Set(todayEvents.map(a => a.ip)).size;
      const currentActiveUsers = activeUsers.size;
      
      return NextResponse.json({
        currentActiveUsers,
        todayUniqueUsers,
        totalEvents: analytics.length,
        todayEvents: todayEvents.length,
      });
    }
    
    if (type === 'events') {
      // Return recent events with details
      const limit = parseInt(searchParams.get('limit') || '50');
      const recentEvents = analytics.slice(-limit).reverse();
      
      return NextResponse.json({
        events: recentEvents,
        total: analytics.length,
      });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
