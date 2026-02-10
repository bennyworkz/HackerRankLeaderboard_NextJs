// Analytics tracking utilities
export interface AnalyticsEvent {
  event: string;
  contestSlug?: string;
  timestamp: number;
  userAgent?: string;
}

export async function trackEvent(event: AnalyticsEvent) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
}

export async function trackPageView() {
  await trackEvent({
    event: 'page_view',
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });
}

export async function trackScrapeStart(contestSlug: string) {
  await trackEvent({
    event: 'scrape_start',
    contestSlug,
    timestamp: Date.now(),
  });
}

export async function trackScrapeComplete(contestSlug: string) {
  await trackEvent({
    event: 'scrape_complete',
    contestSlug,
    timestamp: Date.now(),
  });
}
