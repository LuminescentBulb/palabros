'use client'

import Link from "next/link"
import { MessageCircle, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import SettingsModal from "@/components/settings-modal"
import { useUser } from "@auth0/nextjs-auth0"

// Helper to fetch sessions from FastAPI
async function getSessions(accessToken: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        })
        if (!res.ok) return []
        return await res.json()
    } catch {
        return []
    }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser()
    const [sessions, setSessions] = useState<any[]>([])
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [displayName, setDisplayName] = useState<string>('')

    // Fetch sessions when user is available
    useEffect(() => {
        if (user?.sub) {
            getSessions(user.sub).then(setSessions)
            loadUserDisplayName()
        }
    }, [user])

    const loadUserDisplayName = async () => {
        if (!user?.sub) return
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${user.sub}`,
                },
            })

            if (response.ok) {
                const userData = await response.json()
                // Use custom display_name if set, otherwise fall back to OAuth name
                setDisplayName(userData.display_name || user.name || 'User')
            } else {
                // If user doesn't exist in DB yet, use OAuth name
                setDisplayName(user.name || 'User')
            }
        } catch (error) {
            console.error('Failed to load display name:', error)
            // Fallback to OAuth name on error
            setDisplayName(user.name || 'User')
        }
    }

    // Update display name when settings modal closes (in case it was changed)
    const handleSettingsClose = () => {
        setIsSettingsOpen(false)
        if (user?.sub) {
            loadUserDisplayName() // Reload display name after settings update
        }
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-72 border-r border-gray-200 bg-white flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg">Palabros</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <Link
                        href="/dashboard"
                        className="block px-3 py-2 rounded-md text-sm font-semibold text-white bg-gray-800 hover:opacity-90 transition mb-6 text-center"
                    >
                        + New Chat
                    </Link>

                    {/* Sessions list */}
                    <div className="space-y-1">
                        {sessions.length === 0 && (
                            <p className="text-sm text-gray-400 px-3">No chats yet</p>
                        )}
                        {sessions.map((s: any) => (
                            <Link
                                key={s.id}
                                href={`/dashboard/${s.id}`}
                                className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 truncate"
                            >
                                {s.session_name || "unnamed"}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* User Info */}
                <div className="mt-auto p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.picture}
                            alt={user?.name || "User avatar"}
                            className="w-9 h-9 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {displayName}
                            </p>
                        </div>
                        <button 
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">{children}</main>
            
            {/* Settings Modal */}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={handleSettingsClose}
                onSettingsUpdate={loadUserDisplayName}
            />
        </div>
    )
}
