'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingsUpdate?: () => void // Callback to refresh parent component data
}

interface UserSettings {
  display_name: string
  dialect: string
  experience_level: string
  email: string
}

export default function SettingsModal({ isOpen, onClose, onSettingsUpdate }: SettingsModalProps) {
  const { user } = useUser()
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    dialect: 'mexican',
    experience_level: 'beginner',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

const dialects = [
    { value: 'chilean', label: 'Chilean Spanish' },
    { value: 'mexican', label: 'Mexican Spanish' },
    { value: 'spanish', label: 'Spain Spanish' },
    { value: 'argentinian', label: 'Argentinian Spanish' },
    { value: 'colombian', label: 'Colombian Spanish' },
    { value: 'puerto_rican', label: 'Puerto Rican Spanish' }
]

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'native', label: 'Native/Fluent' }
  ]

  // Load user settings when modal opens
  useEffect(() => {
    if (isOpen && user?.sub) {
      loadUserSettings()
    }
  }, [isOpen, user])

  const loadUserSettings = async () => {
    if (!user?.sub) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${user.sub}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setSettings({
          display_name: userData.display_name || user.name || '',
          dialect: userData.dialect || 'mexican',
          experience_level: userData.experience_level || 'beginner',
          email: userData.email || user.email || ''
        })
      } else {
        // If user doesn't exist yet, use defaults from Auth0
        setSettings({
          display_name: user.name || '',
          dialect: 'mexican',
          experience_level: 'beginner',
          email: user.email || ''
        })
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
      // Fallback to Auth0 data
      setSettings({
        display_name: user.name || '',
        dialect: 'mexican',
        experience_level: 'beginner',
        email: user.email || ''
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.sub) return

    setIsSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.sub}`,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        onSettingsUpdate?.() // Notify parent to refresh data
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Failed to save settings:', errorData)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      // TODO: Show error message to user
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="text-gray-500">Loading settings...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                value={settings.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your display name"
                disabled={isSaving}
              />
            </div>

            {/* Dialect */}
            <div>
              <label htmlFor="dialect" className="block text-sm font-medium text-gray-700 mb-2">
                Spanish Dialect
              </label>
              <select
                id="dialect"
                value={settings.dialect}
                onChange={(e) => handleInputChange('dialect', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSaving}
              >
                {dialects.map(dialect => (
                  <option key={dialect.value} value={dialect.value}>
                    {dialect.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                id="experience_level"
                value={settings.experience_level}
                onChange={(e) => handleInputChange('experience_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSaving}
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
                disabled={isSaving}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}