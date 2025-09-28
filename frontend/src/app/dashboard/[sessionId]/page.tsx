export default async function ChatSession({ params }: { params: { sessionId: string } }) {
    // Fetch messages from DB (placeholder)
    const messages = [
        { id: 1, sender: "user", content: "Estoy muy cansado hoy." },
        { id: 2, sender: "bot", content: "Suena bien, pero aquí diríamos 'ando molido' 💀" },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`px-4 py-2 rounded-xl shadow-sm max-w-lg ${m.sender === "user"
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form className="p-4 border-t">
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-pink-400">
                    <input
                        type="text"
                        placeholder="Escribe algo..."
                        className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                        type="submit"
                        className="ml-2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition"
                    >
                        Send
                    </button>
                </div>
            </form>

        </div>
    )
}
