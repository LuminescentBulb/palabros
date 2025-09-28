"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"

export default function DashboardHome() {
  const [topic, setTopic] = useState("")
  const router = useRouter()
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !user?.sub) return

    // Simply redirect to new session with first message - let [sessionId]/page.tsx handle session creation
    router.push(`/dashboard/new?first=${encodeURIComponent(topic)}`)
    setTopic("")
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome back,{" "}
        <span className="bg-blue-400 bg-clip-text text-transparent">amigo</span> 👋
      </h1>

      <p className="text-gray-600 mb-10 text-center max-w-xl">
        Ready to practice your Spanish slang? Start a new chat below or continue one from the sidebar.
      </p>

      {/* New Chat Input */}
      <div className="w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-gray-100 rounded-full px-5 py-3 shadow-sm hover:shadow transition"
        >
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Inicia una nueva conversación..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
          />
          <button
            type="submit"
            className="ml-3 px-3 py-2 rounded-full bg-gray-700 text-white font-semibold hover:opacity-90 transition"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}
