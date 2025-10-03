import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export function generateMathProblems(
  multiplicandRange: [number, number],
  multiplierRange: [number, number],
  count: number
) {
  const problems = []
  
  for (let i = 0; i < count; i++) {
    const multiplicand = Math.floor(Math.random() * (multiplicandRange[1] - multiplicandRange[0] + 1)) + multiplicandRange[0]
    const multiplier = Math.floor(Math.random() * (multiplierRange[1] - multiplierRange[0] + 1)) + multiplierRange[0]
    
    problems.push({
      id: `problem-${i}`,
      multiplicand,
      multiplier,
      answer: multiplicand * multiplier,
      difficulty: multiplicand <= 5 && multiplier <= 5 ? 'basic' : 
                  multiplicand <= 9 && multiplier <= 9 ? 'intermediate' : 'advanced'
    })
  }
  
  return problems
}
