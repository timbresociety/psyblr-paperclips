import type { ScreenTab } from './game';

export interface AttentionPoint {
  id: string;
  tab: ScreenTab;
  title: string;
  description: string;
  actionLabel: string;
  severity: 'critical' | 'warning' | 'info';
  actionTarget?: {
    tab: ScreenTab;
    modal?: 'hire' | 'refactor' | 'roadmap';
    role?: string;
  };
}
