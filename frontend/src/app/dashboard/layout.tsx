import Link from "next/link"
import { MessageCircle, Settings } from "lucide-react"
import { auth0 } from "@/lib/auth0"

// Helper to fetch sessions from FastAPI
async function getSessions(accessToken: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth0.getSession()
    const accessToken = session?.user.sub

    // If user valid, get them sessions
    const sessions = accessToken ? await getSessions(accessToken) : []
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
                            src={session?.user.picture}
                            alt={session?.user.name || "User avatar"}
                            className="w-9 h-9 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {session?.user.name}
                            </p>
                        </div>
                        <button className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    )
}
