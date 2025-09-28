import { auth0 } from "@/lib/auth0"

export default async function DashboardHome() {
  const session = await auth0.getSession()
  const name = session?.user?.name || "friend"

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome back,{" "}
        <span className="bg-blue-400 bg-clip-text text-transparent">
          {name}
        </span>{" "}
        👋
      </h1>

      <p className="text-gray-600 mb-10 text-center max-w-xl">
        Ready to practice your Spanish slang? Start a new chat below or continue one from the sidebar.
      </p>

      {/* New Chat Input */}
      <div className="w-full max-w-2xl">
        <form className="flex items-center bg-gray-100 rounded-full px-5 py-3 shadow-sm hover:shadow transition">
          <input
            type="text"
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
