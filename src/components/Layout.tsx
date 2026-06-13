import { Outlet, Link } from 'react-router-dom'
import { Camera, FileText, MessageSquare, Mic, Link2 } from 'lucide-react'

export default function Layout() {
  const tabs = [
    { path: '/snap', icon: Camera, label: 'Snap' },
    { path: '/pdf', icon: FileText, label: 'PDF' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/voice', icon: Mic, label: 'Voice' },
    { path: '/url', icon: Link2, label: 'URL' }
  ]

  return (
    <div className="min-h-screen bg-zinc-950">
      <Outlet />
      <nav className="fixed bottom-0 w-full bg-zinc-900 border-t border-zinc-800">
        <div className="flex justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} className="flex flex-col items-center text-zinc-400">
              <Icon size={24} />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
