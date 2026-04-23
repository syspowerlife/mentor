import { describe, it, expect } from 'vitest';
import { calculateProgress, calculateAverageProgress, getOverdueItemsCount } from './metrics';

describe('Metrics Calculations', () => {
  describe('calculateProgress', () => {
    it('should return 0 when total is 0', () => {
      expect(calculateProgress(0, 0)).toBe(0);
      expect(calculateProgress(5, 0)).toBe(0);
    });

    it('should calculate correct percentage', () => {
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(1, 3)).toBe(33); // 33.333... rounded to 33
      expect(calculateProgress(2, 3)).toBe(67); // 66.666... rounded to 67
      expect(calculateProgress(10, 10)).toBe(100);
    });
  });

  describe('calculateAverageProgress', () => {
    it('should return 0 for empty array', () => {
      expect(calculateAverageProgress([])).toBe(0);
    });

    it('should calculate average correctly', () => {
      expect(calculateAverageProgress([{ progresso: 5 }, { progresso: 10 }])).toBe(7.5);
      expect(calculateAverageProgress([{ progresso: 0 }, { progresso: 10 }])).toBe(5);
      expect(calculateAverageProgress([{ progresso: 3 }, { progresso: 3 }, { progresso: 3 }])).toBe(3);
    });

    it('should handle missing progresso field', () => {
      expect(calculateAverageProgress([{ progresso: 10 }, {}])).toBe(5);
    });
  });

  describe('getOverdueItemsCount', () => {
    it('should return 0 for empty array', () => {
      expect(getOverdueItemsCount([])).toBe(0);
    });

    it('should correctly identify overdue items', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day in future

      const items = [
        { prazo: pastDate, status: 'pendente' }, // Overdue
        { prazo: pastDate, status: 'concluida' }, // Completed, not overdue
        { prazo: futureDate, status: 'pendente' }, // Future, not overdue
        { status: 'pendente' } // No date, not overdue
      ];

      expect(getOverdueItemsCount(items)).toBe(1);
    });
  });
});
