"use client"

import Link from "next/link"
import { Clock, Users, BookOpen, Hourglass } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface CourseProps {
  course: {
    course_id: number
    course_name: string
    course_short_description: string
    course_profile_image: string
    course_type: string
    course_duration_hours: number
    course_duration_minutes: number
    course_progress: number
    enrolled_students: number
    lessons_count: number
    rating: number
    validity?: number
    updated_date?: string
    remaining_days?: number
    remaining_hours?: number
    remaining_minutes?: number
  }
}

export function CourseCard({ course }: CourseProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (course.updated_date && course.validity !== undefined) {
      const updateTimeLeft = () => {
        const updatedDate = new Date(course.updated_date as string)
        const expiryDate = new Date(updatedDate.getTime() + (course.validity as number) * 24 * 60 * 60 * 1000)
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
  }, [course.updated_date, course.validity])

  // Format duration
  const formatDuration = (hours: number, minutes: number) => {
    if (hours === 0) {
      return `${minutes} min`
    } else if (minutes === 0) {
      return `${hours} hr`
    } else {
      return `${hours} hr ${minutes} min`
    }
  }

  // Calculate progress color based on percentage
  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <>
      {isExpired ? (
        <div className="cursor-not-allowed">
          <Card className="overflow-hidden h-full transition-all duration-300 opacity-50">
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.course_profile_image || "/placeholder.svg"}
                alt={course.course_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <Badge
                className={`absolute bottom-3 right-3 ${course.course_type === "free" ? "bg-green-500" : "bg-blue-500"}`}
              >
                {course.course_type === "free" ? "Free" : "Premium"}
              </Badge>
            </div>

            <CardContent className={`p-5 ${isExpired ? "opacity-50" : ""}`}>
              <h3
                title={course.course_name}
                className="text-lg font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors"
              >
                {course.course_name}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{course.course_short_description}</p>

              <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span>{formatDuration(course.course_duration_hours, course.course_duration_minutes)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-gray-400" />
                  <span>{course.enrolled_students || "0"} students</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen size={16} className="text-gray-400" />
                  <span>{course.lessons_count || "0"} lessons</span>
                </div>

                {/* Display Validity */}
                {timeLeft !== null && (
                  <div className={`flex items-center gap-1.5 ${isExpired ? "text-red-600" : "text-green-600"}`}>
                    <Hourglass size={16} />
                    <span>{timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {/* <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium">Progress</span>
                  <span className="">{course.course_progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(course.course_progress)}`}
                    style={{ width: `${course.course_progress}%` }}
                  ></div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Link href={`/dashboard/courses/${course.course_id}`}>
          <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer">
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.course_profile_image || "/placeholder.svg"}
                alt={course.course_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <Badge
                className={`absolute bottom-3 right-3 ${course.course_type === "free" ? "bg-green-500" : "bg-blue-500"}`}
              >
                {course.course_type === "free" ? "Free" : "Premium"}
              </Badge>
            </div>

            <CardContent className={`p-5 ${isExpired ? "opacity-50" : ""}`}>
              <h3
                title={course.course_name}
                className="text-lg font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors"
              >
                {course.course_name}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{course.course_short_description}</p>

              <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span>{formatDuration(course.course_duration_hours, course.course_duration_minutes)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-gray-400" />
                  <span>{course.enrolled_students || "0"} students</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen size={16} className="text-gray-400" />
                  <span>{course.lessons_count || "0"} lessons</span>
                </div>

                {/* Display Validity */}
                {timeLeft !== null && (
                  <div className={`flex items-center gap-1.5 ${isExpired ? "text-red-600" : "text-green-600"}`}>
                    <Hourglass size={16} />
                    <span>{timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {/* <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium">Progress</span>
                  <span className="">{course.course_progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(course.course_progress)}`}
                    style={{ width: `${course.course_progress}%` }}
                  ></div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </Link>
      )}
    </>
  )
}
