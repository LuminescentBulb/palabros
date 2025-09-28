"use client"

import { use, useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0";
import SessionHeader from "@/components/session-header"
import { TokenizedMessage } from "@/components/tokenized-message"

type TokenData = {
    index: number
    blurb: string
}

type Message = { 
    id: string | number; 
    sender: "user" | "bot"; 
    content: string;
    token_metadata?: TokenData[]
}
type SessionData = { id: string; session_name: string; dialect: string; summary?: string }

// Global tracking with immediate blocking
const globalLock = { current: null as string | null }
const processedRequests = new Set<string>()

const tryAcquireLock = (requestId: string): boolean => {
    if (processedRequests.has(requestId)) return false
    if (globalLock.current === requestId) return false
    if (globalLock.current !== null) return false
    
    globalLock.current = requestId
    return true
}

const releaseLock = (requestId: string) => {
    if (globalLock.current === requestId) {
        globalLock.current = null
    }
}

export default function ChatSession({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params)
    const router = useRouter()

    const searchParams = useSearchParams()
    const firstMessage = searchParams.get("first")
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [actualSessionId, setActualSessionId] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState("")
    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const { user } = useUser()
    
    // Use refs to prevent duplicate requests
    const initializationRef = useRef<string | null>(null)
    const requestInProgressRef = useRef(false)

    const currentSessionId = actualSessionId || (sessionId !== "new" ? sessionId : null)

    const loadSessionData = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:8000/sessions/${id}`, {
                headers: {
                    "Authorization": `Bearer ${user?.sub}`
                },
            })
            if (response.ok) {
                const data = await response.json()
                setSessionData(data)
            }
        } catch (err) {
            console.error("Error loading session data:", err)
        }
    }

    const sendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || !currentSessionId || loading || requestInProgressRef.current) return

        requestInProgressRef.current = true
        const msg: Message = { id: Date.now(), sender: "user", content: messageText }
        setMessages((prev) => [...prev, msg])
        setLoading(true)
        setNewMessage("")

        try {
            const response = await fetch(`http://localhost:8000/sessions/${currentSessionId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.sub}`
                },
                body: JSON.stringify({ message: messageText }),
            })

            const data = await response.json()
            const botMessage: Message = {
                id: Date.now() + 1,
                sender: "bot",
                content: data.llm.reply,
                token_metadata: data.tokens
            }
            setMessages((prev) => [...prev, botMessage])
        } catch (err) {
            console.error("Error posting message:", err)
        } finally {
            setLoading(false)
            requestInProgressRef.current = false
        }
    }, [currentSessionId, loading, user])

    useEffect(() => {
        if (!user) return
        
        const requestId = `${sessionId}-${firstMessage || 'no-first'}-${user.sub}`
        
        // Try to acquire lock immediately - if fails, someone else is processing
        if (!tryAcquireLock(requestId)) {
            return
        }

        if (firstMessage) {
            if (sessionId === "new") {
                // For new sessions with a first message, create the session first
                const msg: Message = { id: Date.now(), sender: "user", content: firstMessage }
                setMessages([msg])
                setLoading(true)

                // First, create a new session
                fetch(`http://localhost:8000/sessions/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.sub}`
                    },
                    body: JSON.stringify({ dialect: "Mexico" }),
                })
                    .then((res) => res.json())
                    .then((sessionData) => {
                        const newSessionId = sessionData.id
                        setActualSessionId(newSessionId)
                        setSessionData(sessionData)
                        
                        // Now send the first message to the new session
                        return fetch(`http://localhost:8000/sessions/${newSessionId}/messages`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${user?.sub}`
                            },
                            body: JSON.stringify({ message: firstMessage }),
                        }).then(res => ({ res, newSessionId })) // Pass sessionId through
                    })
                    .then(({ res, newSessionId }) => res.json().then(data => ({ data, newSessionId })))
                    .then(({ data, newSessionId }) => {
                        const botMessage: Message = {
                            id: Date.now() + 1,
                            sender: "bot",
                            content: data.llm.reply,
                            token_metadata: data.tokens
                        }
                        setMessages((prev) => [...prev, botMessage])
                        
                        // Update URL without causing component remount - just change browser history
                        window.history.replaceState({}, '', `/dashboard/${newSessionId}`)
                        
                        // Mark as successfully processed
                        processedRequests.add(requestId)
                    })
                    .catch((err) => {
                        console.error("Error creating session or posting message:", err)
                        // On error, remove the optimistic message
                        setMessages([])
                    })
                    .finally(() => {
                        setLoading(false)
                        releaseLock(requestId)
                    })
            } else {
                // For existing sessions with a first message
                const msg: Message = { id: Date.now(), sender: "user", content: firstMessage }
                setMessages([msg])
                setLoading(true)

                fetch(`http://localhost:8000/sessions/${sessionId}/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.sub}`
                    },
                    body: JSON.stringify({ message: firstMessage }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        const botMessage: Message = {
                            id: Date.now() + 1,
                            sender: "bot",
                            content: data.llm.reply,
                            token_metadata: data.tokens
                        }
                        setMessages((prev) => [...prev, botMessage])
                        
                        // Mark as successfully processed
                        processedRequests.add(requestId)
                    })
                    .catch((err) => {
                        console.error("Error posting message:", err)
                    })
                    .finally(() => {
                        setLoading(false)
                        releaseLock(requestId)
                    })
            }
        } else if (!firstMessage && sessionId !== "new") {
            // Load existing messages for an existing session - release lock since no async work
            releaseLock(requestId)
            
            loadSessionData(sessionId)
            fetch(`http://localhost:8000/sessions/${sessionId}/messages`, {
                headers: {
                    "Authorization": `Bearer ${user?.sub}`
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    // Force-cast into your Message[] type
                    const normalized: Message[] = (Array.isArray(data) ? data : []).map((m) => {
                        let tokenMetadata = undefined
                        try {
                            if (m.token_metadata && typeof m.token_metadata === 'string') {
                                tokenMetadata = JSON.parse(m.token_metadata)
                            } else if (m.token_metadata && typeof m.token_metadata === 'object') {
                                tokenMetadata = m.token_metadata
                            }
                        } catch (e) {
                            console.warn('Failed to parse token metadata:', e)
                            tokenMetadata = undefined
                        }
                        
                        return {
                            id: m.id,
                            sender: m.sender === "user" ? "user" : "bot",
                            content: m.content,
                            token_metadata: tokenMetadata
                        }
                    })
                    setMessages(normalized)
                })
                .catch((err) => console.error("Error fetching messages:", err))
        } else {
            // Release lock if we're not doing any async work
            releaseLock(requestId)
        }
        
        // If sessionId is "new" but no firstMessage, just show empty chat
    }, [sessionId, firstMessage, user])


    return (
        <div className="flex flex-col h-full">
            {/* Session Header */}
            {currentSessionId && sessionData && (
                <SessionHeader 
                    sessionId={currentSessionId}
                    sessionName={sessionData.session_name}
                    onSessionNameChange={(newName) => {
                        setSessionData(prev => prev ? { ...prev, session_name: newName } : null)
                    }}
                />
            )}
            
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
                            {m.sender === "bot" ? (
                                <TokenizedMessage 
                                    content={m.content}
                                    tokenMetadata={m.token_metadata}
                                />
                            ) : (
                                m.content
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 flex space-x-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input Bar */}
            <div className="border-t p-4 bg-white">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (requestInProgressRef.current || loading) return
                        
                        if (sessionId === "new" && !actualSessionId) {
                            // For new sessions without actualSessionId, create session first
                            if (!user) return
                            
                            requestInProgressRef.current = true
                            fetch(`http://localhost:8000/sessions/`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${user?.sub}`
                                },
                                body: JSON.stringify({ dialect: "Mexico" }),
                            })
                                .then((res) => res.json())
                                .then((sessionData) => {
                                    setActualSessionId(sessionData.id)
                                    setSessionData(sessionData)
                                    // Now send the message
                                    sendMessage(newMessage)
                                })
                                .catch((err) => {
                                    console.error("Error creating session:", err)
                                    requestInProgressRef.current = false
                                })
                        } else {
                            sendMessage(newMessage)
                        }
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={loading || requestInProgressRef.current || (sessionId === "new" && !actualSessionId && !newMessage.trim())}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || loading || requestInProgressRef.current}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </form>
            </div>
        </div>
    )
}
