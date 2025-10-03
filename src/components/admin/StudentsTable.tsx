import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import type { StudentSummary } from '@/types'

interface StudentsTableProps {
  students: StudentSummary[]
  loading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type SortField = 'email' | 'totalAttempts' | 'accuracy' | 'avgTimePerQuestion' | 'masteryPercentage' | 'lastActive'
type SortDirection = 'asc' | 'desc'

export function StudentsTable({ 
  students, 
  loading, 
  currentPage, 
  totalPages, 
  onPageChange 
}: StudentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastActive')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortField) {
      case 'email':
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        break
      case 'totalAttempts':
        aValue = a.totalAttempts
        bValue = b.totalAttempts
        break
      case 'accuracy':
        aValue = a.accuracy
        bValue = b.accuracy
        break
      case 'avgTimePerQuestion':
        aValue = a.avgTimePerQuestion
        bValue = b.avgTimePerQuestion
        break
      case 'masteryPercentage':
        aValue = a.masteryPercentage
        bValue = b.masteryPercentage
        break
      case 'lastActive':
        aValue = new Date(a.lastActive).getTime()
        bValue = new Date(b.lastActive).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No students found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg text-sm font-medium">
        <div>
          <SortButton field="email">Student</SortButton>
        </div>
        <div>
          <SortButton field="totalAttempts">Attempts</SortButton>
        </div>
        <div>
          <SortButton field="accuracy">Accuracy</SortButton>
        </div>
        <div>
          <SortButton field="avgTimePerQuestion">Avg Time</SortButton>
        </div>
        <div>
          <SortButton field="masteryPercentage">Mastery</SortButton>
        </div>
        <div>
          <SortButton field="lastActive">Last Active</SortButton>
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {sortedStudents.map((student) => (
          <Card key={student.id} className="backdrop-blur-sm bg-white/50 border-white/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-6 gap-4 items-center text-sm">
                <div>
                  <div className="font-medium">{student.displayName || student.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Grade {student.gradeLevel || 'N/A'} • {student.currentGuardrail}
                  </div>
                </div>
                <div className="text-center">
                  {student.totalAttempts.toLocaleString()}
                </div>
                <div className="text-center">
                  <span className={`font-medium ${
                    student.accuracy >= 80 ? 'text-green-600' :
                    student.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.accuracy}%
                  </span>
                </div>
                <div className="text-center">
                  {student.avgTimePerQuestion.toFixed(1)}s
                </div>
                <div className="text-center">
                  <span className={`font-medium ${
                    student.masteryPercentage >= 80 ? 'text-green-600' :
                    student.masteryPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.masteryPercentage}%
                  </span>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {new Date(student.lastActive).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
