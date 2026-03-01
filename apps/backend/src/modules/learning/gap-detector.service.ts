import { Injectable } from '@nestjs/common';
import { LearningService } from './learning.service';

@Injectable()
export class GapDetectorService {
  constructor(private readonly learningService: LearningService) {}

  async detectFromBacklog(limit = 300) {
    return this.learningService.analyzeUnprocessedSignals(limit);
  }
}
