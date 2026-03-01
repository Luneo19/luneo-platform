import { Injectable } from '@nestjs/common';
import { LearningService } from './learning.service';

@Injectable()
export class VerticalAggregatorService {
  constructor(private readonly learningService: LearningService) {}

  async aggregateCrossTenantInsights() {
    return this.learningService.aggregateVerticalInsights();
  }
}
