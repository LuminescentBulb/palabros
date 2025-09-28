"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import { Edit, Trash2, Check, X } from "lucide-react"

interface SessionHeaderProps {
    sessionId: string
    sessionName: string
    onSessionNameChange?: (newName: string) => void
}

export default function SessionHeader({ sessionId, sessionName, onSessionNameChange }: SessionHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(sessionName)
    const [isDeleting, setIsDeleting] = useState(false)
    const { user } = useUser()
    const router = useRouter()

    const handleSaveRename = async () => {
        if (!editName.trim() || editName === sessionName) {
            setIsEditing(false)
            setEditName(sessionName)
            return
        }

        try {
            const response = await fetch(`${process.env.BACKEND_URL}/sessions/${sessionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.sub}`
                },
                body: JSON.stringify({ session_name: editName.trim() })
            })

            if (response.ok) {
                onSessionNameChange?.(editName.trim())
                setIsEditing(false)
            } else {
                console.error("Failed to rename session")
                setEditName(sessionName)
                setIsEditing(false)
            }
        } catch (error) {
            console.error("Error renaming session:", error)
            setEditName(sessionName)
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!isDeleting) {
            setIsDeleting(true)
            return
        }

        try {
            const response = await fetch(`${process.env.BACKEND_URL}/sessions/${sessionId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user?.sub}`
                }
            })

            if (response.ok) {
                router.push("/dashboard")
            } else {
                console.error("Failed to delete session")
                setIsDeleting(false)
            }
        } catch (error) {
            console.error("Error deleting session:", error)
            setIsDeleting(false)
        }
    }

    const handleCancelEdit = () => {
        setEditName(sessionName)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSaveRename()
        } else if (e.key === "Escape") {
            handleCancelEdit()
        }
    }

    return (
        <div className="flex items-center justify-between p-4.5 border-gray-200">
            <div className="flex items-center gap-2 flex-1">
                {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            maxLength={100}
                        />
                        <button
                            onClick={handleSaveRename}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Save"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-lg font-semibold text-gray-900 flex-1">
                            {sessionName}
                        </h1>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title="Rename session"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
            
            <button
                onClick={handleDelete}
                className={`p-1 rounded transition-colors ${
                    isDeleting 
                        ? "text-red-700 bg-red-100 hover:bg-red-200" 
                        : "text-gray-500 hover:bg-gray-100"
                }`}
                title={isDeleting ? "Click again to confirm delete" : "Delete session"}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}