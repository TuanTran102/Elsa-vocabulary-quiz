import { ScoringService } from '../../../../modules/quiz/services/scoring.service.js';

describe('ScoringService', () => {
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
  });

  describe('calculateScore', () => {
    it('should return max points for instant response', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 10000,
        limitSeconds: 30,
      };
      expect(scoringService.calculateScore(params)).toBe(1000);
    });

    it('should return 500 points for response at exactly 50% time', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 25000, // 15 seconds passed out of 30
        limitSeconds: 30,
      };
      expect(scoringService.calculateScore(params)).toBe(500);
    });

    it('should return 0 points for response after time limit', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 41000, // 31 seconds passed
        limitSeconds: 30,
      };
      expect(scoringService.calculateScore(params)).toBe(0);
    });

    it('should return 0 points for exactly at time limit', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 40000, // 30 seconds passed
        limitSeconds: 30,
      };
      expect(scoringService.calculateScore(params)).toBe(0);
    });

    it('should return nearly max points for very fast response', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 10100, // 0.1 second passed
        limitSeconds: 30,
      };
      // Points = 1000 * (29.9 / 30) = 996.666... -> 996 or 997 depending on rounding
      expect(scoringService.calculateScore(params)).toBe(996);
    });

    it('should handle zero base points', () => {
      const params = {
        basePoints: 0,
        startTime: 10000,
        submissionTime: 10100,
        limitSeconds: 30,
      };
      expect(scoringService.calculateScore(params)).toBe(0);
    });

    it('should handle zero limit seconds (though unlikely)', () => {
      const params = {
        basePoints: 1000,
        startTime: 10000,
        submissionTime: 10000,
        limitSeconds: 0,
      };
      expect(scoringService.calculateScore(params)).toBe(0);
    });
    
    it('should floor the result to return an integer score', () => {
        const params = {
          basePoints: 1000,
          startTime: 10000,
          submissionTime: 10500, // 0.5s passed
          limitSeconds: 30,
        };
        // 1000 * (29.5 / 30) = 983.333... -> 983
        expect(scoringService.calculateScore(params)).toBe(983);
      });
  });
});
