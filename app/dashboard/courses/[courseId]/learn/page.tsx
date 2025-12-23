"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader } from "@/components/loader"
import { FileText, Video, BookOpen, Menu, X, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import AnimatedBookViewer to avoid SSR issues with pdfjs-dist
const AnimatedBookViewer = dynamic(() => import("@/components/animated-book-viewer").then((mod) => mod.AnimatedBookViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-400/30 rounded-full animate-spin border-t-orange-500 mx-auto mb-4" />
        <div className="text-white/80 font-medium">Loading book viewer...</div>
      </div>
    </div>
  ),
})

interface CourseContentItem {
  course_mastertitle_breakdown_id: number
  course_mastertitle_breakdown: string
  course_subtitle_id: number
  course_subtitle: string
  subtitle_content: string
  subtitle_code?: string
  helpfull_links?: string
}

interface CourseProgress {
  course_subtitle_id: number
  course_subtitle_progress: number
}

interface CourseStatus {
  data: Array<any>
}

type ContentSection = "pdf" | "video"

export default function CourseLearnPage() {
  const params = useParams()
  const { toast } = useToast()
  const [courseContent, setCourseContent] = useState<CourseContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null)
  const [activeSection, setActiveSection] = useState<ContentSection>("pdf")
  const [sidebarOpen, setSidebarOpen] = useState(true) // Added sidebar state management
  const [isMobile, setIsMobile] = useState(false) // Added mobile detection

  const courseId = params.courseId as string
  const contentRef = useRef<HTMLDivElement>(null)
  const statusUpdateTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const handleResize = () => {
      const isMobileScreen = window.innerWidth < 768
      setIsMobile(isMobileScreen)
      // Auto-close sidebar on mobile
      if (isMobileScreen) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const fetchCourseStatus = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const statusResponse = await api.post("/userCourseStatus", {
        user_id: user.user_id,
        course_id: courseId,
      })
      setCourseStatus(statusResponse.data)
    } catch (error) {
      console.error("Error fetching course status:", error)
    }
  }, [courseId])

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem("user") || "{}")

        const response = await api.post("/course-content", {
          user_id: user.user_id,
          course_id: courseId,
        })

        const content = response.data.data[0]?.get_course_data?.course_content || []
        setCourseContent(content)
        await fetchCourseStatus()
      } catch (error) {
        console.error("Error fetching course content:", error)
        toast({
          title: "Error",
          description: "Failed to load course content",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseContent()
    }

    return () => {
      if (statusUpdateTimeout.current) {
        clearTimeout(statusUpdateTimeout.current)
      }
    }
  }, [courseId, toast, fetchCourseStatus])

  // Hardcoded PDF URL mapping based on courseId
  // Maps course IDs 111, 127, 129 to the 3 PDF volumes
  const getPdfUrlByCourseId = (id: string): string => {
    const pdfUrlMap: Record<string, string> = {
      "111": "https://companian.s3.us-east-1.amazonaws.com/Creative+Writing+and+Short-Form+Vertical+Video+Production+Volume+01+V1.pdf",
      "127": "https://companian.s3.us-east-1.amazonaws.com/Creative+Writing+and+Short-Form+Vertical+Video+Production+Volume+02.pdf",
      "129": "https://companian.s3.us-east-1.amazonaws.com/Creative+Writing+and+Short-Form+Vertical+Video+Production+Volume+03.pdf",
    }
    
    // Return the mapped PDF URL or default to first PDF if courseId not found
    return pdfUrlMap[id] || pdfUrlMap["111"]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  // Get PDF URL based on courseId
  const pdfUrl = getPdfUrlByCourseId(courseId)

  const navigationItems = [
    {
      id: "pdf" as ContentSection,
      label: "Course Material",
      icon: FileText,
      description: "PDF material",
    },
    {
      id: "video" as ContentSection,
      label: "Video Lectures",
      icon: Video,
      description: "Video content",
    },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static md:translate-x-0 z-40 w-full sm:w-80 md:w-72 lg:w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg md:shadow-sm transition-transform duration-300 ease-in-out h-full`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-transparent">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Course Content</h2>
                <p className="text-xs text-gray-500 mt-0.5">Learning Path</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id)
                  if (isMobile) setSidebarOpen(false)
                }}
                className={`w-full flex items-start gap-3 p-4 rounded-lg transition-all duration-200 text-left group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-orange-50 to-orange-50/50 border-2 border-orange-500 shadow-md"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600" />
                )}

                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md scale-110"
                      : "bg-white text-gray-600 group-hover:text-orange-500 group-hover:bg-orange-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm mb-1 transition-colors ${
                      isActive ? "text-orange-700" : "text-gray-900 group-hover:text-orange-600"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className={`text-xs transition-colors ${isActive ? "text-orange-600" : "text-gray-500"}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-transparent">
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-1">🔒 Secure Content</p>
            <p className="text-xs text-orange-600">All materials are encrypted & protected</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden" ref={contentRef}>
        <div className="flex items-center justify-between gap-3 md:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate flex-1">
            {navigationItems.find((item) => item.id === activeSection)?.label}
          </h1>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-auto bg-white">
          {activeSection === "pdf" && (
            <div className="w-full h-full">
              <AnimatedBookViewer pdfUrl={pdfUrl} />
            </div>
          )}

          {activeSection === "video" && (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <div className="text-center max-w-md w-full">
                <div className="mb-6 sm:mb-8 flex justify-center">
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full shadow-lg">
                    <Video className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Video Lectures</h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                  Video content will be available here. This section is coming soon.
                </p>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border-2 border-dashed border-gray-300">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Video player and lecture content will appear in this section once available.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
