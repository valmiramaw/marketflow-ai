import { Sidebar } from './components/sidebar'
import { TopBar } from './components/topbar'
import { ToastProvider } from './components/toast'
import { CommandPalette } from './components/command-palette'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </ToastProvider>
  )
}
