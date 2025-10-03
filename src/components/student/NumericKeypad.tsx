import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Delete, RotateCcw } from 'lucide-react'

interface NumericKeypadProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  maxLength?: number
}

export function NumericKeypad({ value, onChange, onSubmit, disabled = false, maxLength = 3 }: NumericKeypadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNumberClick = (num: string) => {
    if (disabled || isSubmitting) return
    if (value.length < maxLength) {
      onChange(value + num)
    }
  }

  const handleBackspace = () => {
    if (disabled || isSubmitting) return
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    if (disabled || isSubmitting) return
    onChange('')
  }

  const handleSubmit = async () => {
    if (disabled || isSubmitting || !value) return
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled || isSubmitting) return

      // Handle number keys
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleNumberClick(e.key)
      }
      // Handle backspace
      else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      }
      // Handle enter
      else if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      // Handle escape to clear
      else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [value, disabled, isSubmitting])

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Answer Display */}
      <div className="mb-6">
        <div className="bg-white/90 border-2 border-gray-300 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-800">
            {value || '?'}
          </span>
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-muted-foreground">
            {value.length}/{maxLength} digits
          </span>
        </div>
      </div>

      {/* Number Pad - Proper 3x3 Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Row 1: 7, 8, 9 */}
        <Button
          onClick={() => handleNumberClick('7')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          7
        </Button>
        <Button
          onClick={() => handleNumberClick('8')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          8
        </Button>
        <Button
          onClick={() => handleNumberClick('9')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          9
        </Button>

        {/* Row 2: 4, 5, 6 */}
        <Button
          onClick={() => handleNumberClick('4')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          4
        </Button>
        <Button
          onClick={() => handleNumberClick('5')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          5
        </Button>
        <Button
          onClick={() => handleNumberClick('6')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          6
        </Button>

        {/* Row 3: 1, 2, 3 */}
        <Button
          onClick={() => handleNumberClick('1')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          1
        </Button>
        <Button
          onClick={() => handleNumberClick('2')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          2
        </Button>
        <Button
          onClick={() => handleNumberClick('3')}
          disabled={disabled || isSubmitting}
          className="h-20 w-20 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          3
        </Button>

        {/* Row 4: 0 (spans 80% of three columns) */}
        <div className="col-span-3 flex justify-center">
          <Button
            onClick={() => handleNumberClick('0')}
            disabled={disabled || isSubmitting}
            className="h-20 w-32 text-4xl font-bold bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-primary text-gray-800 hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </Button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleBackspace}
          disabled={disabled || isSubmitting || !value}
          variant="outline"
          className="flex-1 h-12 bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-orange-500 text-gray-800 hover:text-orange-500"
        >
          <Delete className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleClear}
          disabled={disabled || isSubmitting || !value}
          variant="outline"
          className="flex-1 h-12 bg-white/90 hover:bg-white border-2 border-gray-300 hover:border-red-500 text-gray-800 hover:text-red-500"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled || isSubmitting || !value}
        className="w-full h-14 mt-4 text-lg font-bold bg-primary hover:bg-primary/90 text-white"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </Button>

      {/* Instructions */}
      <div className="text-center mt-4 text-xs text-muted-foreground">
        <p>Click numbers or use keyboard</p>
        <p>Press Enter to submit, Escape to clear</p>
      </div>
    </div>
  )
}
