import { Injectable } from '@nestjs/common';
import { MID_MARKET_PLAYBOOKS, VerticalPlaybook } from './playbooks.config';

@Injectable()
export class PlaybooksService {
  getAll(): VerticalPlaybook[] {
    return MID_MARKET_PLAYBOOKS;
  }

  getByIndustry(industry?: string): VerticalPlaybook | null {
    if (!industry) return MID_MARKET_PLAYBOOKS[0] ?? null;
    return (
      MID_MARKET_PLAYBOOKS.find(
        (p) => p.industry.toUpperCase() === industry.toUpperCase(),
      ) ?? null
    );
  }
}

