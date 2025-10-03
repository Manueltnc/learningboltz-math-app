import { cn } from '@/lib/utils'

interface MultiplicationDisplayProps {
  multiplicand: number
  multiplier: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showAnswer?: boolean
  answer?: number
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

export function MultiplicationDisplay({ 
  multiplicand, 
  multiplier, 
  size = 'md',
  showAnswer = false,
  answer,
  className,
  variant = 'default'
}: MultiplicationDisplayProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm', 
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const spacingClasses = {
    xs: 'space-y-0.5',
    sm: 'space-y-1',
    md: 'space-y-1.5',
    lg: 'space-y-2',
    xl: 'space-y-2.5'
  }

  const lineWidthClasses = {
    xs: 'border-t',
    sm: 'border-t',
    md: 'border-t-2',
    lg: 'border-t-2',
    xl: 'border-t-2'
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'font-mono text-center leading-tight inline-block',
        sizeClasses[size],
        spacingClasses[size],
        className
      )}>
        {/* Compact horizontal format for small spaces */}
        <div className="flex items-center justify-center gap-1">
          <span>{multiplicand}</span>
          <span>×</span>
          <span>{multiplier}</span>
        </div>
        {showAnswer && answer && (
          <div className="text-center">
            {answer}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn(
        'font-mono text-center leading-tight inline-block',
        sizeClasses[size],
        spacingClasses[size],
        className
      )}>
        {/* Detailed vertical format with proper alignment */}
        <div className="text-right pr-2">
          {multiplicand}
        </div>
        
        <div className="flex items-center justify-end">
          <span className="mr-1">×</span>
          <span>{multiplier}</span>
        </div>
        
        <div className={cn('border-gray-400 mt-1 mb-1', lineWidthClasses[size])}></div>
        
        {showAnswer && answer && (
          <div className="text-right pr-2">
            {answer}
          </div>
        )}
      </div>
    )
  }

  // Default variant - clean vertical format
  return (
    <div className={cn(
      'font-mono text-center leading-tight inline-block',
      sizeClasses[size],
      spacingClasses[size],
      className
    )}>
      {/* Top number (multiplicand) */}
      <div className="text-right pr-1">
        {multiplicand}
      </div>
      
      {/* Multiplication sign and bottom number */}
      <div className="flex items-center justify-end">
        <span className="mr-1">×</span>
        <span>{multiplier}</span>
      </div>
      
      {/* Separator line */}
      <div className={cn('border-gray-400 mt-1 mb-1', lineWidthClasses[size])}></div>
      
      {/* Answer (if shown) */}
      {showAnswer && answer && (
        <div className="text-right pr-1">
          {answer}
        </div>
      )}
    </div>
  )
}

// Convenience components for common use cases
export function MultiplicationProblem({ 
  multiplicand, 
  multiplier, 
  size = 'md',
  className 
}: Omit<MultiplicationDisplayProps, 'showAnswer' | 'answer'>) {
  return (
    <MultiplicationDisplay
      multiplicand={multiplicand}
      multiplier={multiplier}
      size={size}
      showAnswer={false}
      className={className}
    />
  )
}

export function MultiplicationWithAnswer({ 
  multiplicand, 
  multiplier, 
  answer,
  size = 'md',
  className 
}: Omit<MultiplicationDisplayProps, 'showAnswer'> & { answer: number }) {
  return (
    <MultiplicationDisplay
      multiplicand={multiplicand}
      multiplier={multiplier}
      answer={answer}
      showAnswer={true}
      size={size}
      className={className}
    />
  )
}


