import React, { useState, useEffect } from 'react'
import { isMobileApp } from './utils/platform'
import StudySnap from './components/tabs/StudySnap'
import PDFHighlighter from './components/tabs/PDFHighlighter'
import ChatAnalyzer from './components/tabs/ChatAnalyzer'
import VoiceNotes from './components/tabs/VoiceNotes'
import URLInput from './components/tabs/URLInput'
import Settings from './components/Settings'
import Changelog from './components/Changelog'
import BottomTabBar from './components/app-only/BottomTabBar'
import AppStatusBar from './components/app-only/AppStatusBar'
import SiteHeader from './components/web-only/SiteHeader'
import LegalFooter from './components/web-only/LegalFooter'

const TABS = ['snap', 'pdf', 'chat', 'voice', 'url'] as const

function App() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('snap')
  const mobile = isMobileApp()

  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  const renderTab = () => {
    switch(activeTab) {
      case 'snap': return <StudySnap />
      case 'pdf': return <PDFHighlighter />
      case 'chat': return <ChatAnalyzer />
      case 'voice': return <VoiceNotes />
      case 'url': return <URLInput />
    }
  }

  return (
    <div className="min-h-screen flex-col">
      {!mobile && <SiteHeader />}
      {mobile && <AppStatusBar />}

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24 md:pb-4">
        {renderTab()}
      </main>

      {mobile && <BottomTabBar active={activeTab} onChange={setActiveTab} />}
      {!mobile && <LegalFooter />}
    </div>
  )
}

export default App
