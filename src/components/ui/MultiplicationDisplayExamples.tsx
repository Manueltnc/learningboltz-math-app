import { MultiplicationDisplay, MultiplicationProblem, MultiplicationWithAnswer } from './MultiplicationDisplay'

// Example component showing different use cases
export function MultiplicationDisplayExamples() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Different Sizes</h3>
        <div className="flex items-center gap-8">
          <MultiplicationProblem multiplicand={7} multiplier={8} size="xs" />
          <MultiplicationProblem multiplicand={7} multiplier={8} size="sm" />
          <MultiplicationProblem multiplicand={7} multiplier={8} size="md" />
          <MultiplicationProblem multiplicand={7} multiplier={8} size="lg" />
          <MultiplicationProblem multiplicand={7} multiplier={8} size="xl" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Answers</h3>
        <div className="flex items-center gap-8">
          <MultiplicationWithAnswer multiplicand={7} multiplier={8} answer={56} size="md" />
          <MultiplicationWithAnswer multiplicand={12} multiplier={9} answer={108} size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Different Variants</h3>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-2">Default</p>
            <MultiplicationDisplay multiplicand={7} multiplier={8} variant="default" size="md" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Compact</p>
            <MultiplicationDisplay multiplicand={7} multiplier={8} variant="compact" size="md" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Detailed</p>
            <MultiplicationDisplay multiplicand={7} multiplier={8} variant="detailed" size="md" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Styling</h3>
        <div className="flex items-center gap-8">
          <MultiplicationProblem 
            multiplicand={7} 
            multiplier={8} 
            size="lg" 
            className="text-blue-600 bg-blue-50 p-4 rounded-lg" 
          />
          <MultiplicationProblem 
            multiplicand={7} 
            multiplier={8} 
            size="lg" 
            className="text-green-600 bg-green-50 p-4 rounded-lg" 
          />
        </div>
      </div>
    </div>
  )
}


