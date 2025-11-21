import Dexie, { Table } from 'dexie';

export interface LeaderboardEntry {
  id?: number;
  contestSlug: string;
  rank: number;
  hacker: string;
  solved_challenges: number;
  time_taken: number;
  score: number;
  scrapedAt: Date;
}

export interface Contest {
  id?: number;
  slug: string;
  totalEntries: number;
  scrapedAt: Date;
  status: 'scraping' | 'complete' | 'error';
}

export class LeaderboardDB extends Dexie {
  leaderboard!: Table<LeaderboardEntry>;
  contests!: Table<Contest>;

  constructor() {
    super('LeaderboardDB');
    this.version(1).stores({
      leaderboard: '++id, contestSlug, rank',
      contests: '++id, slug, scrapedAt',
    });
  }
}

export const db = new LeaderboardDB();
