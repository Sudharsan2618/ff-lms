"use client"

import { useEffect, useState } from "react"

interface CourseValidityDisplayProps {
  validity: number
  updatedDate: string
}

export function BatchCourseValidityDisplay({ validity, updatedDate }: CourseValidityDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (updatedDate && validity !== undefined) {
      const updateTimeLeft = () => {
        const parsedUpdatedDate = new Date(updatedDate)
        const expiryDate = new Date(parsedUpdatedDate.getTime() + validity * 24 * 60 * 60 * 1000)
        const now = new Date()
        const remaining = expiryDate.getTime() - now.getTime()

        if (remaining <= 0) {
          setTimeLeft("Expired")
          setIsExpired(true)
        } else {
          setIsExpired(false)
          const totalSeconds = Math.floor(remaining / 1000)
          const days = Math.floor(totalSeconds / (24 * 60 * 60))
          const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
          const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
          const seconds = totalSeconds % 60

          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }
      }

      // Update immediately and then every second
      updateTimeLeft()
      const timerId = setInterval(updateTimeLeft, 1000)

      return () => clearInterval(timerId)
    }
  }, [updatedDate, validity])

  if (timeLeft === null) {
    return null // Or a loading indicator
  }

  return <div className={`text-sm ${isExpired ? "text-red-600" : "text-green-600"}`}>Validity: {timeLeft}</div>
}
