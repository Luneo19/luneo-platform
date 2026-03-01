import { Injectable } from '@nestjs/common';

interface ScoredChunk {
  id: string;
  score: number;
}

@Injectable()
export class RerankerService {
  rerank(query: string, candidates: ScoredChunk[], topK: number, minScore: number): ScoredChunk[] {
    const normalized = query.toLowerCase();

    const rescored = candidates.map((candidate) => {
      let bonus = 0;
      if (/urgent|important|critical/.test(normalized)) {
        bonus += 0.03;
      }
      return {
        ...candidate,
        score: Math.min(1, candidate.score + bonus),
      };
    });

    return rescored
      .filter((candidate) => candidate.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
