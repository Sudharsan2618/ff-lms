"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Chatbot } from "@/components/chatbot"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
      return
    }

    // Check if user has completed the assessment
    const hasCompletedQuestions = JSON.parse(localStorage.getItem("hasCompletedQuestions") || "false")
    if (!hasCompletedQuestions) {
      router.push("/questions")
      return
    }

    setIsLoading(false)

    // Session timeout check
    const timeoutDuration = 900000 // 15 minutes
    const checkSessionTimeout = () => {
      const lastActivity = localStorage.getItem("lastActivity")
      if (lastActivity && Date.now() - Number.parseInt(lastActivity) > timeoutDuration) {
        handleLogout()
      }
    }

    const resetActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString())
    }

    const handleLogout = () => {
      localStorage.removeItem("user")
      localStorage.removeItem("hasCompletedQuestions")
      localStorage.removeItem("lastActivity")
      router.push("/login")
    }

    const intervalId = setInterval(checkSessionTimeout, 5000)
    resetActivity() // Set initial activity timestamp

    document.addEventListener("mousemove", resetActivity)
    document.addEventListener("keypress", resetActivity)
    document.addEventListener("touchstart", resetActivity)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener("mousemove", resetActivity)
      document.removeEventListener("keypress", resetActivity)
      document.removeEventListener("touchstart", resetActivity)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow overflow-auto" id="parent">
        {children}
      </main>
      <Chatbot />
    </div>
  )
}
