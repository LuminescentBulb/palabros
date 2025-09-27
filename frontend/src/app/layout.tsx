import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Suspense } from "react"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "HablaBot - Learn Spanish Through AI Conversation",
  description:
    "Master Spanish slang and natural conversation with our AI chatbot. Practice with different dialects from Mexico, Spain, Argentina and more.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense>
          {children}
          <Footer />
        </Suspense>
      </body>
    </html>
  )
}
