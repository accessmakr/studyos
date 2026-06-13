import React from 'react'
import ToolCore from '../tool/ToolCore'
import { processText } from '../../utils/aiProcessor'

export default function ChatAnalyzer() {
  return (
    <ToolCore
      title="Chat Analyzer - Paste Chat Export"
      placeholder="Paste WhatsApp, Telegram, or Discord chat export. I'll extract Q&A and key points..."
      processFn={processText}
    />
  )
}
