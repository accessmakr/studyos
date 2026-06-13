import React from 'react'
import ToolCore from '../tool/ToolCore'
import { processText } from '../../utils/aiProcessor'

export default function StudySnap() {
  return (
    <ToolCore
      title="StudySnap - Paste Text"
      placeholder="Paste your lecture notes, textbook content, or any study material here..."
      processFn={processText}
    />
  )
}
