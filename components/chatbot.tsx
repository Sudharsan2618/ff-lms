"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, X, Maximize, Minimize, Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [messages, isOpen])

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    setMessages((prev) => [...prev, { role: "assistant", content: "" }])
    setIsLoading(true)

    try {
      const response = await fetch(`${api.defaults.baseURL}/flim-frame/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let assistantContent = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: "assistant", content: assistantContent }
            return updated
          })
        }
      }
    } catch (error) {
      console.error("Error fetching AI response:", error)
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40"
          size="icon"
        >
          <Bot size={24} />
        </Button>
      )}

      {isOpen && (
        <div
          className={`fixed z-50 ${
            isFullScreen ? "inset-0" : "bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px]"
          } bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 transition-all duration-300`}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h2 className="text-base font-semibold">AI Assistant</h2>
                <p className="text-xs text-white/80">How can I help you today?</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsFullScreen(!isFullScreen)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
              <Button onClick={toggleChat} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <X size={18} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3 p-6">
                <Bot size={48} className="text-primary/60" />
                <div>
                  <p className="font-medium text-gray-700">Welcome to FrameFlow Assistant!</p>
                  <p className="text-sm mt-1">
                    Ask me anything about your courses, assignments, or learning resources.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m, index) => (
                <div key={index} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                    }`}
                  >
                    {m.content === "Thinking..." ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse">Thinking</div>
                        <div className="flex space-x-1">
                          <div
                            className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    ) : m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 border-t bg-white rounded-b-lg">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
              <Input
                ref={inputRef}
                className="flex-grow bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                value={input}
                placeholder="Type your message here..."
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </form>
          </CardFooter>
        </div>
      )}
    </>
  )
}
