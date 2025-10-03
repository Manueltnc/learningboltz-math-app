import { cn } from '@/lib/utils'

interface EquationDisplayProps {
  multiplicand: number
  multiplier: number
  showAnswer?: boolean
  answer?: number
  size?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  variant?: 'horizontal' | 'vertical'
  className?: string
}

export function EquationDisplay({ 
  multiplicand, 
  multiplier, 
  showAnswer = false,
  answer,
  size = 'xl',
  variant = 'horizontal',
  className
}: EquationDisplayProps) {
  const sizeClasses = {
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  }

  const spacingClasses = {
    lg: 'gap-2',
    xl: 'gap-3',
    '2xl': 'gap-4',
    '3xl': 'gap-5',
    '4xl': 'gap-6',
    '5xl': 'gap-8',
    '6xl': 'gap-10'
  }

  const lineWidthClasses = {
    lg: 'border-t',
    xl: 'border-t-2',
    '2xl': 'border-t-2',
    '3xl': 'border-t-4',
    '4xl': 'border-t-4',
    '5xl': 'border-t-4',
    '6xl': 'border-t-4'
  }

  if (variant === 'vertical') {
    return (
      <div className={cn(
        'font-sans text-center leading-tight inline-block',
        sizeClasses[size],
        className
      )}>
        {/* Vertical format with proper alignment */}
        <div className="text-right pr-2">
          {multiplicand}
        </div>
        
        <div className="flex items-center justify-end">
          <span className="mr-1">×</span>
          <span>{multiplier}</span>
        </div>
        
        <div className={cn('border-gray-400 mt-1 mb-1', lineWidthClasses[size])}></div>
        
        {showAnswer && answer !== undefined ? (
          <div className="text-right pr-2">
            {answer}
          </div>
        ) : (
          <div className="text-right pr-2">
            ?
          </div>
        )}
      </div>
    )
  }

  // Horizontal format (default)
  return (
    <div className={cn(
      'font-sans text-center flex items-center justify-center',
      sizeClasses[size],
      spacingClasses[size],
      className
    )}>
      <span>{multiplicand}</span>
      <span>×</span>
      <span>{multiplier}</span>
      <span>=</span>
      {showAnswer && answer !== undefined ? (
        <span>{answer}</span>
      ) : (
        <span>?</span>
      )}
    </div>
  )
}

// Convenience components for common use cases
export function EquationProblem({ 
  multiplicand, 
  multiplier, 
  size = 'xl',
  variant = 'horizontal',
  className 
}: Omit<EquationDisplayProps, 'showAnswer' | 'answer'>) {
  return (
    <EquationDisplay
      multiplicand={multiplicand}
      multiplier={multiplier}
      size={size}
      variant={variant}
      showAnswer={false}
      className={className}
    />
  )
}

export function EquationWithAnswer({ 
  multiplicand, 
  multiplier, 
  answer,
  size = 'xl',
  variant = 'horizontal',
  className 
}: Omit<EquationDisplayProps, 'showAnswer'> & { answer: number }) {
  return (
    <EquationDisplay
      multiplicand={multiplicand}
      multiplier={multiplier}
      answer={answer}
      showAnswer={true}
      size={size}
      variant={variant}
      className={className}
    />
  )
}
