import { useState } from 'react'
import { VisualProgressGrid } from './VisualProgressGrid'

interface ProgressGridModalProps {
  email: string
  gradeLevel: string
  isOpen: boolean
  onClose: () => void
}

export function ProgressGridModal({ email, gradeLevel, isOpen, onClose }: ProgressGridModalProps) {
  if (!isOpen) return null

  return (
    <VisualProgressGrid
      email={email}
      gradeLevel={gradeLevel}
      isModal={true}
      onClose={onClose}
      showTitle={true}
      compact={false}
    />
  )
}
