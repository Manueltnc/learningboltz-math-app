import { describe, it, expect } from 'vitest'
import {
  getDifficultyBand,
  getTimeClassification,
  getEasternTimeDate,
  calculateAccuracy,
  calculateAverageTime,
  generateMockQuestionAttempts,
  generateMockDailyMetrics
} from '../lib/analytics-utils'

describe('Analytics Utils', () => {
  describe('getDifficultyBand', () => {
    it('should return basic for 1-5 range', () => {
      expect(getDifficultyBand(1, 1)).toBe('basic')
      expect(getDifficultyBand(5, 5)).toBe('basic')
      expect(getDifficultyBand(3, 4)).toBe('basic')
    })

    it('should return intermediate for 6-9 range', () => {
      expect(getDifficultyBand(6, 6)).toBe('intermediate')
      expect(getDifficultyBand(9, 9)).toBe('intermediate')
      expect(getDifficultyBand(7, 8)).toBe('intermediate')
    })

    it('should return advanced for 10-12 range', () => {
      expect(getDifficultyBand(10, 10)).toBe('advanced')
      expect(getDifficultyBand(12, 12)).toBe('advanced')
      expect(getDifficultyBand(11, 12)).toBe('advanced')
    })

    it('should use max value for classification', () => {
      expect(getDifficultyBand(1, 6)).toBe('intermediate')
      expect(getDifficultyBand(5, 10)).toBe('advanced')
      expect(getDifficultyBand(9, 2)).toBe('intermediate')
    })
  })

  describe('getTimeClassification', () => {
    const config = { fastThreshold: 5, mediumThreshold: 15 }

    it('should classify fast times correctly', () => {
      expect(getTimeClassification(3, config)).toBe('fast')
      expect(getTimeClassification(4.9, config)).toBe('fast')
    })

    it('should classify medium times correctly', () => {
      expect(getTimeClassification(5, config)).toBe('medium')
      expect(getTimeClassification(10, config)).toBe('medium')
      expect(getTimeClassification(15, config)).toBe('medium')
    })

    it('should classify slow times correctly', () => {
      expect(getTimeClassification(15.1, config)).toBe('slow')
      expect(getTimeClassification(30, config)).toBe('slow')
    })
  })

  describe('getEasternTimeDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = getEasternTimeDate(date)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle different timezones correctly', () => {
      // Test with a known date to ensure consistent results
      const date = new Date('2024-01-15T00:00:00Z')
      const result = getEasternTimeDate(date)
      expect(result).toBe('2024-01-14') // UTC midnight is 7 PM ET previous day
    })
  })

  describe('calculateAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      expect(calculateAccuracy(8, 10)).toBe(80)
      expect(calculateAccuracy(7, 10)).toBe(70)
      expect(calculateAccuracy(0, 10)).toBe(0)
    })

    it('should handle zero total', () => {
      expect(calculateAccuracy(5, 0)).toBe(0)
      expect(calculateAccuracy(0, 0)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(calculateAccuracy(1, 3)).toBe(33)
      expect(calculateAccuracy(2, 3)).toBe(67)
    })
  })

  describe('calculateAverageTime', () => {
    it('should calculate average time correctly', () => {
      expect(calculateAverageTime(100, 10)).toBe(10)
      expect(calculateAverageTime(150, 10)).toBe(15)
    })

    it('should handle zero attempts', () => {
      expect(calculateAverageTime(100, 0)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      expect(calculateAverageTime(100, 3)).toBe(33.33)
    })
  })

  describe('generateMockQuestionAttempts', () => {
    it('should generate correct number of attempts', () => {
      const attempts = generateMockQuestionAttempts(10)
      expect(attempts).toHaveLength(10)
    })

    it('should have valid structure', () => {
      const attempts = generateMockQuestionAttempts(1)
      const attempt = attempts[0]
      
      expect(attempt).toHaveProperty('id')
      expect(attempt).toHaveProperty('multiplicand')
      expect(attempt).toHaveProperty('multiplier')
      expect(attempt).toHaveProperty('correctAnswer')
      expect(attempt).toHaveProperty('isCorrect')
      expect(attempt).toHaveProperty('timeSpentSeconds')
      expect(attempt).toHaveProperty('timeClassification')
    })

    it('should have correct answer calculation', () => {
      const attempts = generateMockQuestionAttempts(10)
      attempts.forEach(attempt => {
        expect(attempt.correctAnswer).toBe(attempt.multiplicand * attempt.multiplier)
      })
    })

    it('should have valid time classification', () => {
      const attempts = generateMockQuestionAttempts(10)
      attempts.forEach(attempt => {
        expect(['fast', 'medium', 'slow']).toContain(attempt.timeClassification)
      })
    })
  })

  describe('generateMockDailyMetrics', () => {
    it('should generate correct number of days', () => {
      const metrics = generateMockDailyMetrics(7)
      expect(metrics).toHaveLength(7)
    })

    it('should have valid structure', () => {
      const metrics = generateMockDailyMetrics(1)
      const metric = metrics[0]
      
      expect(metric).toHaveProperty('id')
      expect(metric).toHaveProperty('studentId')
      expect(metric).toHaveProperty('metricDate')
      expect(metric).toHaveProperty('appType', 'math')
      expect(metric).toHaveProperty('attempted')
      expect(metric).toHaveProperty('correct')
      expect(metric).toHaveProperty('avgTimeSeconds')
    })

    it('should have valid date format', () => {
      const metrics = generateMockDailyMetrics(5)
      metrics.forEach(metric => {
        expect(metric.metricDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should have logical accuracy', () => {
      const metrics = generateMockDailyMetrics(10)
      metrics.forEach(metric => {
        expect(metric.correct).toBeLessThanOrEqual(metric.attempted)
        expect(metric.correct).toBeGreaterThanOrEqual(0)
      })
    })
  })
})
