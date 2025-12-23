"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, BarChart, Target, UserCheck, ClipboardList, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader } from "@/components/loader"

interface CourseDetails {
  course: {
    course_id: number
    course_name: string
    course_description: string
    course_profile_image: string
    course_level: string
    course_type: string
    roles: string
    course_objective: string
    pre_requirments: string
    enroll: boolean
  }
}

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [pptLoading, setPptLoading] = useState(false)

  const courseId = params.courseId as string

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem("user") || "{}")

        const response = await api.post("/course/enrollment_details", {
          course_id: courseId,
          user_id: user.user_id,
        })

        setCourseDetails(response.data)
      } catch (error) {
        console.error("Error fetching course details:", error)
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseDetails()
    }
  }, [courseId, toast])

  const handleEnrollCourse = async () => {
    try {
      setEnrolling(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      await api.post("/course/user_enroll", {
        user_id: user.user_id,
        course_id: courseId,
      })

      toast({
        title: "Success",
        description: "You have successfully enrolled in this course",
      })

      router.push(`/dashboard/courses/${courseId}/learn`)
    } catch (error) {
      console.error("Error enrolling in course:", error)
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleContinueLearning = () => {
    router.push(`/dashboard/courses/${courseId}/learn`)
  }

  const handleViewPpt = async () => {
    try {
      setPptLoading(true)
      // Open a blank tab immediately to avoid popup blockers
      const newTab = window.open("about:blank", "_blank", "noopener,noreferrer")
      const response = await api.get(`/course-ppt-url/${courseId}`)
      const pptUrl = (response as any)?.data?.ppt_url
      if (pptUrl) {
        if (newTab) {
          newTab.location.href = pptUrl
        } else {
          window.open(pptUrl, "_blank", "noopener,noreferrer")
        }
      } else {
        toast({
          title: "PPT not found",
          description: "No PPT available for this course",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching PPT URL:", error)
      const msg = error?.response?.data?.message || "Failed to fetch PPT URL"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setPptLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  const course = courseDetails?.course

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Course not found</h3>
          <p className="text-gray-500 mb-4">The course you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/dashboard/courses")}>Back to Courses</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-sm"
          onClick={() => router.push("/dashboard/courses")}
        >
          <ArrowLeft size={16} />
          Back to Courses
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{course.course_name}</h1>
            <p className="text-lg mb-6">{course.course_description}</p>

            {/* CTA Buttons */}
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {course.enroll ? (
                <Button onClick={handleContinueLearning} className="text-lg py-6 px-8">
                  Continue Learning
                </Button>
              ) : (
                <Button onClick={handleEnrollCourse} className="text-lg py-6 px-8" disabled={enrolling}>
                  {enrolling ? "Enrolling..." : "Enroll Now"}
                </Button>
              )}
              <Button variant="outline" onClick={handleViewPpt} disabled={pptLoading} className="text-lg py-6 px-8">
                {pptLoading ? "Opening..." : "View PPT"}
              </Button>
            </div>
          </div>

          {/* Right Content (Course Image) */}
          <div className="flex justify-center">
            <img
              src={course.course_profile_image || "/placeholder.svg"}
              alt={course.course_name}
              className="rounded-lg shadow-lg w-full max-w-md"
            />
          </div>
        </div>

        {/* Course Details */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Course Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Level</h3>
                    <p>{course.course_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Type</h3>
                    <p>{course.course_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Suitable Roles</h3>
                    <p>{course.roles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Target className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Objective</h3>
                    <p>{course.course_objective}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <ClipboardList className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Prerequisites</h3>
                    <p>{course.pre_requirments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
