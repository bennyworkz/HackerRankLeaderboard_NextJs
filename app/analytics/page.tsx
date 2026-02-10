"use client";

import { useEffect, useState } from "react";

interface AnalyticsStats {
  currentActiveUsers: number;
  todayUniqueUsers: number;
  totalEvents: number;
  todayEvents: number;
}

interface AnalyticsEvent {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  event: string;
  contestSlug?: string;
  timestamp: number;
  userAgent?: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/analytics?type=stats'),
        fetch('/api/analytics?type=events&limit=100'),
      ]);

      const statsData = await statsRes.json();
      const eventsData = await eventsRes.json();

      setStats(statsData);
      setEvents(eventsData.events || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        📊 Analytics Dashboard
      </h1>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            🟢 Active Users (Now)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.currentActiveUsers || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            👥 Unique Users (Today)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.todayUniqueUsers || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            📈 Events (Today)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.todayEvents || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            📊 Total Events
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.totalEvents || 0}
          </div>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Recent Events
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Event</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>IP Address</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Location</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Contest</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr 
                  key={index}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: event.event === 'page_view' ? '#dbeafe' : 
                                     event.event === 'scrape_start' ? '#fef3c7' : '#dcfce7',
                      color: event.event === 'page_view' ? '#1e40af' : 
                             event.event === 'scrape_start' ? '#92400e' : '#166534'
                    }}>
                      {event.event}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {event.ip}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {event.city && event.country 
                      ? `${event.city}, ${event.country}`
                      : event.country || 'Unknown'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {event.contestSlug || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No events recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
