"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BatchCourseValidityDisplay } from "@/components/batch-course-validity-display"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, CopyIcon, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

interface Course {
  course_id: number
  course_name: string
  course_short_description: string
  course_type: string
  course_duration_hours: number
  course_duration_minutes: number
  language: string
  rating: number
  course_profile_image: string
}

interface User {
  user_id: number
  username: string
}

interface QCUserCourse {
  user_id: number
  courses: { course_id: number; validity_days: number }[]
}

// Add interface for API response
interface QCAnalyticsResponse {
  status: string
  data: {
    total_batches: number
    batches: Array<{
      qc_id: number
      batch_name: string
      users: Array<{
        user_id: number // Add user_id field
        username: string
        initial_assessment: string
        courses: Array<{
          course_id: number
          course_name: string
          enrollment_status: string
          completion_status: string
          certificate_id: string | null
          validity: number
          updated_date: string
        }>
      }>
    }>
  }
}

export default function AdminPage() {
  const [numUsers, setNumUsers] = useState<number>(0)
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [validityDays, setValidityDays] = useState<number>(30)
  const [numUsersInput, setNumUsersInput] = useState<string>("1")

  // Course creation states
  const [currentStep, setCurrentStep] = useState(1)
  const [courseData, setCourseData] = useState({
    course_name: "",
    course_short_description: "",
    course_type: "",
    course_duration_hours: 0,
    course_duration_minutes: 0,
    language: "",
    rating: 0,
    course_profile_image: "",
    course_description: "",
    course_objective: "",
    pre_requirments: "",
    course_level: "",
    roles: "",
    enrollment_type: "free",
  })
  const [courseId, setCourseId] = useState<number | null>(null)
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step3Mode, setStep3Mode] = useState<"upload" | "generate" | null>(null)

  // Add state for courses and loading
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  // Add state for pending courses (Yet to Approve)
  const [pendingCourses, setPendingCourses] = useState<any[]>([])
  const [pendingCoursesLoading, setPendingCoursesLoading] = useState(true)
  const [pendingCoursesError, setPendingCoursesError] = useState<string | null>(null)

  // Validation state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Analytics states
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [totalCoursesAnalytics, setTotalCoursesAnalytics] = useState(0) // Renamed to avoid conflict
  const [batchesData, setBatchesData] = useState<any[]>([]) // State for hierarchical data
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // Tree view state for expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(["qc-batch-all-qc-batches"])) // Expand QC root by default

  // New states for batch actions
  const [isAddUsersDialogOpen, setIsAddUsersDialogOpen] = useState(false)
  const [isExtendValidityDialogOpen, setIsExtendValidityDialogOpen] = useState(false)
  const [currentBatch, setCurrentBatch] = useState<any>(null) // To store the batch data for the dialogs
  const [numUsersToAdd, setNumUsersToAdd] = useState<string>("1")
  const [extendValidityDays, setExtendValidityDays] = useState<string>("30")
  const [selectedCourseForValidity, setSelectedCourseForValidity] = useState<number | null>(null)
  const [generatedBatchKeys, setGeneratedBatchKeys] = useState<string[]>([]) // For keys generated within a batch

  // State to hold courses specific to the currently selected batch for validity extension
  const [batchCourses, setBatchCourses] = useState<Course[]>([])

  // QC Batch states
  const [isQCBatchDialogOpen, setIsQCBatchDialogOpen] = useState(false)
  const [qcBatchName, setQCBatchName] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [qcUserCourses, setQCUserCourses] = useState<QCUserCourse[]>([])

  // QC Analytics states
  const [qcBatchesData, setQCBatchesData] = useState<any[]>([])
  const [qcAnalyticsLoading, setQCAnalyticsLoading] = useState(true)
  const [qcAnalyticsError, setQCAnalyticsError] = useState<string | null>(null)

  // New states for QC batch user actions
  const [isAddQCCourseDialogOpen, setIsAddQCCourseDialogOpen] = useState(false)
  const [isExtendQCCourseValidityDialogOpen, setIsExtendQCCourseValidityDialogOpen] = useState(false)
  const [currentQCUser, setCurrentQCUser] = useState<any>(null) // Store current QC user for dialogs
  const [selectedCourseToAddQC, setSelectedCourseToAddQC] = useState<number | null>(null)
  const [validityDaysAddQCCourse, setValidityDaysAddQCCourse] = useState<string>("30")
  const [selectedCourseToExtendQC, setSelectedCourseToExtendQC] = useState<number | null>(null)
  const [extendValidityDaysQC, setExtendValidityDaysQC] = useState<string>("30")
  const [currentQCBatch, setCurrentQCBatch] = useState<any>(null) // Added state for currentQCUser

  // Add state for streaming and parsed syllabus
  const [streamingContent, setStreamingContent] = useState("")
  const [parsedSyllabus, setParsedSyllabus] = useState<any>(null)
  const [streamError, setStreamError] = useState<string | null>(null)

  const router = useRouter()

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsCourse, setDetailsCourse] = useState<any>(null)
  const [detailsContent, setDetailsContent] = useState<any[]>([])

  // Add activeTab state for tab tracking
  const [activeTab, setActiveTab] = useState("global-analysis")

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("hasCompletedQuestions")
    localStorage.removeItem("lastActivity")
    router.push("/login")
  }

  const toggleNode = (id: string) => {
    const newExpandedNodes = new Set(expandedNodes)
    if (newExpandedNodes.has(id)) {
      newExpandedNodes.delete(id)
    } else {
      newExpandedNodes.add(id)
    }
    setExpandedNodes(newExpandedNodes)
  }

  // Validation logic for each step
  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {}
    if (step === 1) {
      if (!courseData.course_name.trim()) errors.course_name = "Course name is required"
      if (!courseData.course_short_description.trim()) errors.course_short_description = "Short description is required"
      if (!courseData.course_type.trim()) errors.course_type = "Course type is required"
      if (!courseData.language.trim()) errors.language = "Language is required"
      if (
        (!courseData.course_duration_hours && courseData.course_duration_hours !== 0) ||
        courseData.course_duration_hours < 0
      )
        errors.course_duration_hours = "Duration (hours) must be 0 or more"
      if (courseData.course_duration_minutes < 0)
        errors.course_duration_minutes = "Duration (minutes) must be 0 or more"
    } else if (step === 2) {
      if (!courseData.course_description.trim()) errors.course_description = "Detailed description is required"
      else if (courseData.course_description.trim().length < 100)
        errors.course_description = "Description must be at least 100 characters"
      if (!courseData.course_objective.trim()) errors.course_objective = "Course objectives are required"
      if (!courseData.pre_requirments.trim()) errors.pre_requirments = "Prerequisites are required"
      if (!courseData.course_level.trim()) errors.course_level = "Course level is required"
      if (!courseData.enrollment_type.trim()) errors.enrollment_type = "Enrollment type is required"
    } else if (step === 3) {
      if (step3Mode === "upload" && !selectedFile) {
        errors.selectedFile = "Course content file is required"
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleGenerateKeys = async () => {
    // Convert numUsersInput to number for the API call
    const numUsersNum = Number.parseInt(numUsersInput, 10)
    if (isNaN(numUsersNum) || numUsersNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of users.",
        variant: "destructive",
      })
      return
    }
    if (selectedCourses.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one course.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await api.post("/generate-keys", {
        num_users: numUsersNum, // Use the parsed number
        batch_name: batchName,
        course_ids: selectedCourses,
        validity_days: validityDays,
      })

      const keys = response.data.split("\n").filter((key: string) => key.trim() !== "")
      setGeneratedKeys(keys)
    } catch (error) {
      console.error("Error generating keys:", error)
      toast({
        title: "Error",
        description: "Failed to generate keys. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Local storage helpers for course creation
  const LOCAL_STORAGE_KEY = "course_creation_data"
  function saveCourseDataToLocalStorage(data: any) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  }
  function getCourseDataFromLocalStorage() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : null
  }
  function clearCourseDataFromLocalStorage() {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const handleCourseCreation = async () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) return
    try {
      setIsLoading(true)

      // Step 1: Create course master
      if (currentStep === 1) {
        const response = await api.post("/courseMaster", {
          course_name: courseData.course_name,
          course_short_description: courseData.course_short_description,
          course_type: courseData.course_type,
          course_duration_hours: courseData.course_duration_hours,
          course_duration_minutes: courseData.course_duration_minutes,
          language: courseData.language,
          rating: courseData.rating,
          course_profile_image: courseData.course_profile_image,
        })
        setCourseId(response.data.course_id)
        setCurrentStep(2)
        // Save to local storage
        saveCourseDataToLocalStorage({ ...courseData, course_id: response.data.course_id, step: 1 })
      }

      // Step 2: Create course enrollment
      else if (currentStep === 2) {
        const response = await api.post("/courseEnrollment", {
          course_id: courseId,
          course_description: courseData.course_description,
          course_objective: courseData.course_objective,
          pre_requirments: courseData.pre_requirments,
          course_level: courseData.course_level,
          roles: courseData.roles,
          course_type: courseData.enrollment_type,
        })
        setEnrollmentId(response.data.enrollment_id)
        setCurrentStep(3)
        // Save to local storage
        saveCourseDataToLocalStorage({
          ...courseData,
          course_id: courseId,
          enrollment_id: response.data.enrollment_id,
          step: 2,
        })
      }

      // Step 3: Upload course content (only if upload mode)
      else if (currentStep === 3 && step3Mode === "upload" && selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        await api.post("/courseContent/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        // Reset form and close dialog
        setCurrentStep(1)
        setCourseData({
          course_name: "",
          course_short_description: "",
          course_type: "",
          course_duration_hours: 0,
          course_duration_minutes: 0,
          language: "",
          rating: 0,
          course_profile_image: "",
          course_description: "",
          course_objective: "",
          pre_requirments: "",
          course_level: "",
          roles: "",
          enrollment_type: "free",
        })
        setCourseId(null)
        setEnrollmentId(null)
        setSelectedFile(null)
        setIsDialogOpen(false)
        clearCourseDataFromLocalStorage()
        toast({ title: "Course Created", description: "The course was created successfully.", variant: "default" })
        reloadCourses()
        return
      }

      // Step 3: Handle content generation from button click
      else if (currentStep === 3 && step3Mode === "generate") {
        console.log("Attempting to start content generation...")
        console.log("Parsed Syllabus:", parsedSyllabus)
        if (!parsedSyllabus) {
          toast({ title: "Error", description: "Please generate a syllabus first.", variant: "destructive" })
          setIsLoading(false)
          return
        }

        const saved = getCourseDataFromLocalStorage()
        console.log("Saved course data from localStorage:", saved)
        console.log("Current courseId:", courseId)
        if (!saved || !courseId) {
          toast({
            title: "Error",
            description: "Course data or ID is missing. Please start over.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        try {
          const payload = {
            course_id: courseId,
            course_name: saved.course_name,
            course_data: parsedSyllabus,
          }
          console.log("Making API call to /content-generate/detailed-content with data:", payload)

          // Start background generation
          await api.post("/content-generate/detailed-content", payload)

          console.log("API call successful.")

          // Reset form and close dialog
          setCurrentStep(1)
          setCourseData({
            course_name: "",
            course_short_description: "",
            course_type: "",
            course_duration_hours: 0,
            course_duration_minutes: 0,
            language: "",
            rating: 0,
            course_profile_image: "",
            course_description: "",
            course_objective: "",
            pre_requirments: "",
            course_level: "",
            roles: "",
            enrollment_type: "free",
          })
          setCourseId(null)
          setEnrollmentId(null)
          setSelectedFile(null)
          setParsedSyllabus(null)
          setIsDialogOpen(false)
          clearCourseDataFromLocalStorage()
          toast({
            title: "Success",
            description: "Content generation started. Track progress in the 'Yet to Approve' section.",
            variant: "default",
          })
          reloadCourses()
        } catch (error) {
          console.error("Error starting content generation:", error)
          toast({ title: "Error", description: "Failed to start content generation.", variant: "destructive" })
        }
      }
    } catch (error) {
      console.error("Error in course creation:", error)
      toast({ title: "Error", description: "Failed to create course.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Handler for generating content
  const handleGenerateContent = async () => {
    setIsLoading(true)
    setStreamingContent("")
    setParsedSyllabus(null)
    setStreamError(null)

    const saved = getCourseDataFromLocalStorage()
    if (!saved) {
      toast({ title: "Error", description: "No course data found in local storage.", variant: "destructive" })
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch(`${api.defaults.baseURL}/content-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_name: saved.course_name,
          content_type: saved.course_level,
          duration_hours: saved.course_duration_hours,
          duration_minutes: saved.course_duration_minutes,
          preferences: saved.preferences || "",
        }),
      })
      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let buffer = ""
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          setStreamingContent(buffer)

          // Process each line (SSE event)
          const lines = buffer.split("\n")
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const json = JSON.parse(line.replace("data:", "").trim())
                if (json.complete) {
                  setParsedSyllabus(json.complete)
                }
              } catch (e) {
                // Ignore parse errors for partial lines
              }
            }
          }
        }
      }
    } catch (error) {
      setStreamError("Failed to generate content.")
      toast({ title: "Error", description: "Failed to generate content.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch courses on mount and after creation
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        setCoursesError(null)
        const response = await api.get("/course-master")
        setCourses(response.data.courses || [])
      } catch (error: any) {
        setCoursesError("Failed to fetch courses")
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
    fetchPendingCourses() // Also fetch pending courses
  }, [])

  // Fetch analytics data when the tab is active
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true)
        setAnalyticsError(null) // Clear previous errors
        const response = await api.get("/admin/batch-analytics")

        console.log("Batch Analytics API Response:", response.data) // Log the response

        // Check if the expected data structure exists (response.data.data)
        if (response.data && response.data.data) {
          const data = response.data.data // Correctly access data
          setTotalUsers(data.total_users || 0) // Use || 0 for safety
          setTotalBatches(data.total_batches || 0) // Use || 0 for safety
          setTotalCoursesAnalytics(data.total_courses || 0) // Use || 0 for safety

          // Wrap the batches in a root 'All Batches' node
          const allBatchesNode = {
            batch_id: "all-batches",
            batch_name: "All Batches",
            is_root: true,
            children: data.batches || [],
          }
          setBatchesData([allBatchesNode]) // Set as array with single root node
        } else {
          // Handle unexpected response structure
          console.error("Batch Analytics API returned unexpected data structure:", response.data)
          setAnalyticsError("Received unexpected data from the server.")
          setTotalUsers(0)
          setTotalBatches(0)
          setTotalCoursesAnalytics(0)
          setBatchesData([])
        }
      } catch (error: any) {
        console.error("Error fetching analytics:", error)
        setAnalyticsError("Failed to fetch analytics data. " + (error.message || "")) // Include error message
        setTotalUsers(0)
        setTotalBatches(0)
        setTotalCoursesAnalytics(0)
        setBatchesData([])
      } finally {
        setAnalyticsLoading(false)
      }
    }

    // Only fetch if the 'users' tab is the active one (assuming default value reflects this)
    // A more robust solution would involve checking the actual active tab state if available
    fetchAnalytics()
  }, []) // Depend on [] to fetch once on mount, or add a state variable tied to tab change if needed

  // Add retry utility function
  const retry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
    try {
      return await fn()
    } catch (error: any) {
      if (retries === 0) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retry(fn, retries - 1, delay * 2)
    }
  }

  // Modify the QC Analytics fetch effect
  useEffect(() => {
    const fetchQCAnalytics = async () => {
      try {
        setQCAnalyticsLoading(true)
        setQCAnalyticsError(null)

        // Add retry logic to the request
        const response = await retry(async () => {
          try {
            return await api.get<QCAnalyticsResponse>("/qc-batch/detailed-analytics")
          } catch (error: any) {
            // If it's a 500 error, we'll retry
            if (error.response?.status === 500) {
              console.warn("Received 500 error, retrying...")
              throw error // This will trigger the retry
            }
            throw error // Other errors will be handled normally
          }
        })

        // The response data should already be parsed by axios
        const responseData = response.data
        console.log("QC Batch Analytics API Response:", responseData)

        if (responseData && responseData.status === "success" && responseData.data && responseData.data.data) {
          const qcBatches = responseData.data.data.batches // Corrected data access
          // Wrap QC batches in a root 'All QC Batches' node
          const allQCBatchesNode = {
            qc_id: "all-qc-batches",
            batch_name: "All QC Batches",
            is_root: true,
            children: qcBatches,
          }
          setQCBatchesData([allQCBatchesNode])
        } else {
          console.error("QC Batch Analytics API returned unexpected data structure:", responseData)
          setQCAnalyticsError("Received unexpected data from the server.")
          setQCBatchesData([])
        }
      } catch (error: any) {
        console.error("Error fetching QC analytics:", error)

        // Handle different types of errors with more specific messages
        if (error._isAxiosError) {
          if (error.response) {
            // Server responded with error status
            if (error.response.status === 500) {
              setQCAnalyticsError("Server is temporarily unavailable. Please try again later.")
            } else {
              const errorMessage = error.response.data?.message || error.response.data?.error || "Unknown server error"
              setQCAnalyticsError(`Server error (${error.response.status}): ${errorMessage}`)
            }
          } else if (error.request) {
            // No response received
            setQCAnalyticsError(
              `No response received from server (${error.request.method} ${error.request.url}). Please check your connection.`,
            )
          } else {
            // Other Axios errors
            setQCAnalyticsError(`API Error: ${error.message}`)
          }
        } else if (error.message === "Request timeout") {
          // Request timeout
          setQCAnalyticsError("Request timed out. Please try again.")
        } else {
          // Other errors
          setQCAnalyticsError(`Failed to fetch QC analytics: ${error.message || "Unknown error"}`)
        }

        setQCBatchesData([])
      } finally {
        setQCAnalyticsLoading(false)
      }
    }

    fetchQCAnalytics()
  }, []) // Fetch once on mount

  // Helper to reload courses
  const reloadCourses = async () => {
    try {
      setCoursesLoading(true)
      setCoursesError(null)
      const response = await api.get("/course-master")
      setCourses(response.data.courses || [])
    } catch (error: any) {
      setCoursesError("Failed to fetch courses")
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
    // Also reload pending courses
    fetchPendingCourses()
  }

  // Helper to fetch pending courses (Yet to Approve)
  const fetchPendingCourses = async () => {
    try {
      setPendingCoursesLoading(true)
      setPendingCoursesError(null)
      const response = await api.get("/content-generate/pending-approval")

      if (response.data && response.data.data) {
        const coursesWithProgress = response.data.data.map((course: any) => {
          let progress = 0
          if (course.latest_status === "completed") {
            progress = 100
          } else if (course.latest_status && course.latest_status.startsWith("processing_")) {
            const progressValue = Number.parseInt(course.latest_status.split("_")[1], 10)
            progress = isNaN(progressValue) ? 0 : progressValue
          }
          return { ...course, progress }
        })
        setPendingCourses(coursesWithProgress)
      } else {
        setPendingCourses([])
      }
    } catch (error: any) {
      setPendingCoursesError("Failed to fetch pending courses")
      setPendingCourses([])
      console.error("Error fetching pending courses:", error)
    } finally {
      setPendingCoursesLoading(false)
    }
  }

  // Function to handle downloading keys as CSV
  const handleDownloadKeys = () => {
    if (generatedKeys.length === 0) return

    const csvContent = "Key ID\n" + generatedKeys.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "generated_keys.csv"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Handle adding users to a specific batch
  const handleAddUsersToBatch = async () => {
    if (!currentBatch || Number.parseInt(numUsersToAdd, 10) <= 0) {
      toast({
        title: "Error",
        description: "Please select a batch and enter a valid number of users.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setGeneratedBatchKeys([]) // Clear previous keys
    try {
      const response = await api.post("/admin/generate-user-keys", {
        batch_id: currentBatch.batch_id,
        num_users: Number.parseInt(numUsersToAdd, 10),
      })

      if (response.data.status === "success") {
        // The response structure is an array of arrays, so flatten it
        const keys = response.data.keys.flat()
        setGeneratedBatchKeys(keys)
        toast({
          title: "Success",
          description: response.data.message,
        })
      } else {
        console.error("API Error generating batch keys:", response.data)
        toast({
          title: "Error",
          description: response.data.message || "Failed to generate keys for batch.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating batch keys:", error)
      toast({
        title: "Error",
        description: "Failed to generate keys for batch. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle extending validity for a specific batch and course
  const handleExtendValidity = async () => {
    if (!currentBatch || selectedCourseForValidity === null || Number.parseInt(extendValidityDays, 10) <= 0) {
      toast({
        title: "Error",
        description: "Please select a batch, a course, and enter a valid number of days.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post("/admin/extend-validity", {
        batch_id: currentBatch.batch_id,
        course_id: selectedCourseForValidity,
        validity_days: Number.parseInt(extendValidityDays, 10),
      })

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: response.data.message,
        })
        // Optionally, refetch analytics data to show updated validity dates
        // fetchAnalytics(); // You might need to make fetchAnalytics available outside useEffect or call it explicitly
      } else {
        console.error("API Error extending validity:", response.data)
        toast({
          title: "Error",
          description: response.data.message || "Failed to extend validity.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error extending validity:", error)
      toast({
        title: "Error",
        description: "Failed to extend validity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        setUsersError(null)
        const response = await api.get("/admin/users")
        setUsers(response.data.data || [])
      } catch (error: any) {
        setUsersError("Failed to fetch users")
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Function to add new user-course pair
  const handleAddQCUserCourse = () => {
    setQCUserCourses([...qcUserCourses, { user_id: 0, courses: [] }])
  }

  // Function to remove user-course pair
  const handleRemoveQCUserCourse = (index: number) => {
    setQCUserCourses(qcUserCourses.filter((_, i) => i !== index))
  }

  // Function to update user id
  const handleUpdateQCUser = (index: number, user_id: number) => {
    const updated = [...qcUserCourses]
    updated[index] = { ...updated[index], user_id }
    setQCUserCourses(updated)
  }

  // Function to update courses for a user (add/remove course)
  const handleToggleCourseForUser = (userIndex: number, course_id: number, checked: boolean) => {
    const updated = [...qcUserCourses]
    const userCourses = updated[userIndex].courses || []
    if (checked) {
      // Add course with default validity (e.g., 1 day)
      updated[userIndex].courses = [...userCourses, { course_id, validity_days: 1 }]
    } else {
      // Remove course
      updated[userIndex].courses = userCourses.filter((c) => c.course_id !== course_id)
    }
    setQCUserCourses(updated)
  }

  // Function to update validity for a course
  const handleUpdateCourseValidity = (userIndex: number, course_id: number, validity_days: number) => {
    const updated = [...qcUserCourses]
    updated[userIndex].courses = updated[userIndex].courses.map((c) =>
      c.course_id === course_id ? { ...c, validity_days } : c,
    )
    setQCUserCourses(updated)
  }

  // Function to handle QC batch creation
  const handleCreateQCBatch = async () => {
    if (!qcBatchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch name",
        variant: "destructive",
      })
      return
    }

    if (qcUserCourses.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one user-course pair",
        variant: "destructive",
      })
      return
    }

    // Check if all users and courses are selected and validity is set
    const isValid = qcUserCourses.every(
      (pair) => pair.user_id !== 0 && pair.courses.length > 0 && pair.courses.every((c) => c.validity_days > 0),
    )
    if (!isValid) {
      toast({
        title: "Error",
        description: "Please select both user and courses (with validity) for all entries",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post("/qc-batch/create", {
        batch_name: qcBatchName,
        user_courses: qcUserCourses,
      })

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: `QC Batch '${response.data.data.batch_name}' created successfully.`, // Use batch name from response
        })
        // Reset form and close dialog on success
        setIsQCBatchDialogOpen(false)
        setQCBatchName("")
        setQCUserCourses([])
        // Optionally, refresh analytics or batch list here if needed
        // fetchAnalytics(); // Uncomment if you have this function available outside useEffect
      } else if (response.data.errors && response.data.errors.length > 0) {
        // Handle specific errors returned in the response data
        const errorMessages = response.data.errors
          .map((err: any) => err.message || err.error || JSON.stringify(err))
          .join(", ")
        toast({
          title: "Error",
          description: `Failed to create QC Batch: ${errorMessages}`,
          variant: "destructive",
        })
      } else {
        // Handle unexpected success response structure or generic API error message
        console.error("API Error creating QC batch:", response.data)
        toast({
          title: "Error",
          description: response.data.message || "Failed to create QC Batch with an unexpected response.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error creating QC batch:", error)
      toast({
        title: "Error",
        description: "Failed to create QC Batch. Please try again." + (error.message ? ` (${error.message})` : ""),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add QC Batch handlers
  const handleAddQCCourse = async () => {
    if (!currentQCUser || !selectedCourseToAddQC || Number.parseInt(validityDaysAddQCCourse, 10) <= 0) {
      toast({
        title: "Error",
        description: "Please select a user, course, and enter valid days.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post("/qc-batch/add-course", {
        user_id: currentQCUser.user_id,
        course_id: selectedCourseToAddQC,
        validity_days: Number.parseInt(validityDaysAddQCCourse, 10),
      })

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: response.data.message,
        })
        // Refresh QC analytics data
        const qcResponse = await api.get("/qc-batch/detailed-analytics")
        if (qcResponse.data && qcResponse.data.data && Array.isArray(qcResponse.data.data.batches)) {
          const qcBatches = qcResponse.data.data.batches
          const allQCBatchesNode = {
            qc_id: "all-qc-batches",
            batch_name: "All QC Batches",
            is_root: true,
            children: qcBatches,
          }
          setQCBatchesData([allQCBatchesNode])
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to add course.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding QC course:", error)
      toast({
        title: "Error",
        description: "Failed to add course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsAddQCCourseDialogOpen(false)
    }
  }

  const handleExtendQCCourseValidity = async () => {
    if (!currentQCUser || !selectedCourseToExtendQC || Number.parseInt(extendValidityDaysQC, 10) <= 0) {
      toast({
        title: "Error",
        description: "Please select a user, course, and enter valid days.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post("/qc-batch/extend-validity", {
        user_id: currentQCUser.user_id,
        course_id: selectedCourseToExtendQC,
        validity_days: Number.parseInt(extendValidityDaysQC, 10),
      })

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: response.data.message,
        })
        // Refresh QC analytics data
        const qcResponse = await api.get("/qc-batch/detailed-analytics")
        if (qcResponse.data && qcResponse.data.data && Array.isArray(qcResponse.data.data.batches)) {
          const qcBatches = qcResponse.data.data.batches
          const allQCBatchesNode = {
            qc_id: "all-qc-batches",
            batch_name: "All QC Batches",
            is_root: true,
            children: qcBatches,
          }
          setQCBatchesData([allQCBatchesNode])
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to extend validity.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error extending QC course validity:", error)
      toast({
        title: "Error",
        description: "Failed to extend validity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsExtendQCCourseValidityDialogOpen(false)
    }
  }

  // Add state for the new Create Course Dialog
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false)

  // Add state for JSON editing
  const [isEditingJson, setIsEditingJson] = useState(false)
  const [jsonEditValue, setJsonEditValue] = useState("")
  const [jsonEditError, setJsonEditError] = useState("")

  const handleViewDetails = async (course: any) => {
    setDetailsDialogOpen(true)
    setDetailsCourse(course)
    setDetailsLoading(true)
    setDetailsContent([])
    try {
      const response = await api.get(`/transaction-view/course-content/${course.course_id}`)
      setDetailsContent(response.data.data || [])
    } catch (err) {
      setDetailsContent([])
      toast({ title: "Error", description: "Failed to fetch course content.", variant: "destructive" })
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDownloadCourseContent = () => {
    if (!detailsContent.length) return
    const ws = XLSX.utils.json_to_sheet(detailsContent)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "CourseContent")
    XLSX.writeFile(wb, `course_content_${detailsCourse.course_id}.xlsx`)
  }

  // Download Questions as Excel
  const handleDownloadQuestions = async () => {
    if (!detailsCourse?.course_id) return
    setDetailsLoading(true)
    try {
      const response = await api.get(`/transaction-view/questions/${detailsCourse.course_id}`)
      const questions = response.data.data || []
      if (!questions.length) {
        toast({ title: "No Questions", description: "No questions found for this course.", variant: "destructive" })
        return
      }
      const ws = XLSX.utils.json_to_sheet(questions)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Questions")
      XLSX.writeFile(wb, `questions_${detailsCourse.course_id}.xlsx`)
    } catch (err) {
      toast({ title: "Error", description: "Failed to download questions.", variant: "destructive" })
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleApproveCourse = async () => {
    if (!detailsCourse?.course_id) return
    setDetailsLoading(true)
    try {
      const response = await api.post(`/transaction-view/approve-course/${detailsCourse.course_id}`)
      toast({
        title: "Success",
        description: response.data.message || "Course approved successfully!",
        variant: "default",
      })
      setDetailsDialogOpen(false)
      // Optionally refresh the pending courses list
      fetchPendingCourses()
    } catch (err) {
      toast({ title: "Error", description: "Failed to approve course.", variant: "destructive" })
    } finally {
      setDetailsLoading(false)
    }
  }

  // Prefill data from local storage on mount
  useEffect(() => {
    const saved = getCourseDataFromLocalStorage()
    if (saved) {
      setCourseData((prev) => ({ ...prev, ...saved }))
      if (saved.course_id) setCourseId(saved.course_id)
      if (saved.enrollment_id) setEnrollmentId(saved.enrollment_id)
    }
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Logout Button */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab)
          // Reset dialog state when switching tabs
          setDetailsDialogOpen(false)
          setDetailsCourse(null)
          setDetailsContent([])
          setDetailsLoading(false)
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="global-analysis">Global Analysis</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Replace the Global Analysis tab content with comprehensive analytics dashboard */}
        <TabsContent value="global-analysis">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Global Analysis</h2>
                <p className="text-gray-600 mt-1">Comprehensive LMS performance metrics and trends</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">300</div>
                  <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-600"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">234</div>
                  <p className="text-xs text-gray-500 mt-1">78% engagement rate</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-purple-600"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">24</div>
                  <p className="text-xs text-gray-500 mt-1">+3 new courses this month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-orange-600"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">72.5%</div>
                  <p className="text-xs text-gray-500 mt-1">+5.2% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* User Status Distribution */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">User Status Distribution</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Active vs Inactive users breakdown</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium">Active Users</span>
                      </div>
                      <span className="text-lg font-bold">234 (78%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium">Inactive Users</span>
                      </div>
                      <span className="text-lg font-bold">66 (22%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "22%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Trending Courses */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Top Trending Courses</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Most enrolled courses this month</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Advanced React Patterns", enrollments: 45, trend: "+12%" },
                      { name: "Web Development Fundamentals", enrollments: 38, trend: "+8%" },
                      { name: "Python for Data Science", enrollments: 32, trend: "+15%" },
                      { name: "UI/UX Design Principles", enrollments: 28, trend: "+5%" },
                      { name: "Cloud Computing Basics", enrollments: 22, trend: "+3%" },
                    ].map((course, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{course.name}</p>
                          <p className="text-xs text-gray-500">{course.enrollments} enrollments</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{course.trend}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Performance & Engagement */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Course Completion Status */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Course Completion Status</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Across all 24 courses</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completed</span>
                        <span className="text-sm font-bold">156 (52%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "52%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">In Progress</span>
                        <span className="text-sm font-bold">98 (33%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Not Started</span>
                        <span className="text-sm font-bold">46 (15%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate Issues */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Certificate Issues</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Current status breakdown</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-green-900">Issued</p>
                        <p className="text-xs text-green-700">Successfully generated</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">142</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Pending</p>
                        <p className="text-xs text-yellow-700">Awaiting completion</p>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">12</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="text-sm font-medium text-red-900">Failed</p>
                        <p className="text-xs text-red-700">Requires attention</p>
                      </div>
                      <span className="text-2xl font-bold text-red-600">2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Engagement Comparison */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Student Engagement: AI Support vs Teacher Support
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Learning preference trends over the last 30 days</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-blue-900">AI Support Interactions</h4>
                        <span className="text-2xl font-bold text-blue-600">1,245</span>
                      </div>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p>• Average response time: 2.3 seconds</p>
                        <p>• User satisfaction: 4.2/5.0</p>
                        <p>• Most common queries: Concept clarification (45%)</p>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-purple-900">Teacher Support Interactions</h4>
                        <span className="text-2xl font-bold text-purple-600">342</span>
                      </div>
                      <div className="space-y-2 text-sm text-purple-800">
                        <p>• Average response time: 4.5 hours</p>
                        <p>• User satisfaction: 4.7/5.0</p>
                        <p>• Most common queries: Assignment help (62%)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Engagement trend (last 7 days)</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium">AI Support</span>
                        <div className="flex-1 flex gap-1">
                          {[65, 72, 68, 75, 82, 88, 92].map((val, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-blue-200 rounded"
                              style={{ height: `${val * 0.8}px` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs font-medium">Teacher Support</span>
                        <div className="flex-1 flex gap-1">
                          {[45, 48, 42, 50, 48, 52, 55].map((val, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-purple-200 rounded"
                              style={{ height: `${val * 0.8}px` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity Heatmap */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Weekly Activity Heatmap</CardTitle>
                <p className="text-sm text-gray-500 mt-1">User engagement patterns by day and hour</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="space-y-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-16">{day}</span>
                        <div className="flex gap-1">
                          {[12, 18, 25, 32, 28, 35, 42, 38, 45, 52, 48, 35, 28, 22, 18, 15].map((intensity, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded text-xs flex items-center justify-center text-white font-bold"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${intensity / 52})`,
                              }}
                              title={`${intensity} users`}
                            >
                              {intensity > 40 ? "●" : ""}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                    <span>Low</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                        ></div>
                      ))}
                    </div>
                    <span>High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Trend (Last 7 Days) visualization */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Engagement Trend (Last 7 Days)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Daily user engagement and activity metrics</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Line Chart for Daily Engagement */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Daily Active Users & Course Interactions</h3>
                    <div className="relative h-64 bg-gradient-to-b from-blue-50 to-transparent rounded-lg p-4">
                      <svg className="w-full h-full" viewBox="0 0 700 250" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[0, 50, 100, 150, 200].map((y) => (
                          <line
                            key={`grid-${y}`}
                            x1="40"
                            y1={200 - y}
                            x2="680"
                            y2={200 - y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Y-axis */}
                        <line x1="40" y1="20" x2="40" y2="200" stroke="#374151" strokeWidth="2" />
                        {/* X-axis */}
                        <line x1="40" y1="200" x2="680" y2="200" stroke="#374151" strokeWidth="2" />

                        {/* Y-axis labels */}
                        {[0, 50, 100, 150, 200].map((y, i) => (
                          <text key={`y-label-${i}`} x="25" y={205 - y} fontSize="12" fill="#6b7280" textAnchor="end">
                            {i * 50}
                          </text>
                        ))}

                        {/* Active Users Line (Blue) */}
                        <polyline
                          points="80,160 160,140 240,130 320,110 400,100 480,95 560,85"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Course Interactions Line (Purple) */}
                        <polyline
                          points="80,140 160,120 240,110 320,95 400,85 480,75 560,65"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points for Active Users */}
                        {[80, 160, 240, 320, 400, 480, 560].map((x, i) => (
                          <circle
                            key={`point-blue-${i}`}
                            cx={x}
                            cy={[160, 140, 130, 110, 100, 95, 85][i]}
                            r="4"
                            fill="#3b82f6"
                          />
                        ))}

                        {/* Data points for Course Interactions */}
                        {[80, 160, 240, 320, 400, 480, 560].map((x, i) => (
                          <circle
                            key={`point-purple-${i}`}
                            cx={x}
                            cy={[140, 120, 110, 95, 85, 75, 65][i]}
                            r="4"
                            fill="#a855f7"
                          />
                        ))}

                        {/* X-axis labels (Days) */}
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                          <text
                            key={`x-label-${i}`}
                            x={80 + i * 80}
                            y="220"
                            fontSize="12"
                            fill="#6b7280"
                            textAnchor="middle"
                          >
                            {day}
                          </text>
                        ))}
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 mt-4 justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-600">Active Users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-600">Course Interactions</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Stats Table */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Daily Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-3 font-semibold">Day</th>
                            <th className="text-center py-2 px-3 font-semibold">Active Users</th>
                            <th className="text-center py-2 px-3 font-semibold">Interactions</th>
                            <th className="text-center py-2 px-3 font-semibold">Avg Session (min)</th>
                            <th className="text-center py-2 px-3 font-semibold">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { day: "Monday", users: 234, interactions: 1245, session: 28, completion: 72 },
                            { day: "Tuesday", users: 256, interactions: 1389, session: 31, completion: 75 },
                            { day: "Wednesday", users: 267, interactions: 1456, session: 33, completion: 78 },
                            { day: "Thursday", users: 289, interactions: 1623, session: 36, completion: 81 },
                            { day: "Friday", users: 301, interactions: 1745, session: 38, completion: 83 },
                            { day: "Saturday", users: 312, interactions: 1834, session: 40, completion: 85 },
                            { day: "Sunday", users: 328, interactions: 1923, session: 42, completion: 87 },
                          ].map((stat, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">{stat.day}</td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                                  {stat.users}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                                  {stat.interactions}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3 text-gray-600">{stat.session}</td>
                              <td className="text-center py-2 px-3">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-12 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${stat.completion}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-semibold text-green-600">{stat.completion}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Peak Engagement</p>
                      <p className="text-lg font-bold text-blue-900">Sunday - 328 users</p>
                      <p className="text-xs text-blue-700 mt-1">40% increase from Monday</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">Avg Interactions</p>
                      <p className="text-lg font-bold text-purple-900">1,631/day</p>
                      <p className="text-xs text-purple-700 mt-1">↑ 12% from last week</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1">Avg Completion</p>
                      <p className="text-lg font-bold text-green-900">80.1%</p>
                      <p className="text-xs text-green-700 mt-1">↑ 5% from last week</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Performance Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Course Performance Details</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Detailed metrics for top 5 courses</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-semibold">Course Name</th>
                        <th className="text-center py-3 px-2 font-semibold">Enrollments</th>
                        <th className="text-center py-3 px-2 font-semibold">Completion %</th>
                        <th className="text-center py-3 px-2 font-semibold">Avg Rating</th>
                        <th className="text-center py-3 px-2 font-semibold">Certificates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Advanced React Patterns", enrollments: 45, completion: 82, rating: 4.8, certs: 37 },
                        {
                          name: "Web Development Fundamentals",
                          enrollments: 38,
                          completion: 76,
                          rating: 4.6,
                          certs: 29,
                        },
                        { name: "Python for Data Science", enrollments: 32, completion: 88, rating: 4.9, certs: 28 },
                        { name: "UI/UX Design Principles", enrollments: 28, completion: 71, rating: 4.5, certs: 20 },
                        { name: "Cloud Computing Basics", enrollments: 22, completion: 64, rating: 4.3, certs: 14 },
                      ].map((course, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">{course.name}</td>
                          <td className="text-center py-3 px-2 font-semibold">{course.enrollments}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${course.completion}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold">{course.completion}%</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="inline-flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                              ⭐ {course.rating}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2 font-semibold text-green-600">{course.certs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600 mt-1">Manage users, batches, and course assignments</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create New Users
                </Button>
                <Button variant="outline" onClick={() => setIsQCBatchDialogOpen(true)} className="gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create QC Batch
                </Button>
              </div>
            </div>

            {/* Analytics Cards (for Users Tab - These are placeholders as actual data is in Global Analysis) */}
            <div className="grid gap-4 md:grid-cols-3">
              {analyticsLoading ? (
                <>
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className="border-0 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : analyticsError ? (
                <div className="col-span-3 text-red-500">{analyticsError}</div>
              ) : (
                <>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-blue-600"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
                      <p className="text-xs text-gray-500 mt-1">Active users in system</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Batches</CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-purple-600"
                        >
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{totalBatches}</div>
                      <p className="text-xs text-gray-500 mt-1">Active batches</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-green-600"
                        >
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{totalCoursesAnalytics}</div>
                      <p className="text-xs text-gray-500 mt-1">Available courses</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Create New Users Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <div className="hidden" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Users Batch</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="batchName" className="text-right">
                      Batch Name
                    </Label>
                    <Input
                      id="batchName"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="numUsers" className="text-right">
                      Number of Users
                    </Label>
                    <Input
                      id="numUsers"
                      type="number"
                      value={numUsersInput}
                      onChange={(e) => setNumUsersInput(e.target.value)}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="validityDays" className="text-right">
                      Validity (Days)
                    </Label>
                    <Input
                      id="validityDays"
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number.parseInt(e.target.value))}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="selectCourses" className="text-right pt-2">
                      Select Courses
                    </Label>
                    <div className="col-span-3 max-h-40 overflow-y-auto space-y-2">
                      {courses.map((course) => (
                        <div key={course.course_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`course-${course.course_id}`}
                            checked={selectedCourses.includes(course.course_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourses([...selectedCourses, course.course_id])
                              } else {
                                setSelectedCourses(selectedCourses.filter((id) => id !== course.course_id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`course-${course.course_id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {course.course_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleGenerateKeys}
                    disabled={
                      isLoading ||
                      !batchName.trim() ||
                      Number.parseInt(numUsersInput, 10) <= 0 ||
                      selectedCourses.length === 0
                    }
                  >
                    {isLoading ? "Generating..." : "Generate Keys"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create New QC Batch Dialog */}
            <Dialog open={isQCBatchDialogOpen} onOpenChange={setIsQCBatchDialogOpen}>
              <DialogTrigger asChild>
                <div className="hidden" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New QC Batch</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qcBatchName" className="text-right">
                      QC Batch Name
                    </Label>
                    <Input
                      id="qcBatchName"
                      value={qcBatchName}
                      onChange={(e) => setQCBatchName(e.target.value)}
                      className="col-span-3"
                      placeholder="Enter QC batch name"
                    />
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {qcUserCourses.map((pair, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-white">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">User</Label>
                            <Select
                              value={pair.user_id.toString()}
                              onValueChange={(value) => handleUpdateQCUser(index, Number.parseInt(value))}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                              <SelectContent style={{ maxHeight: "200px", overflowY: "auto", paddingBottom: "8px" }}>
                                {users.map((user) => (
                                  <SelectItem key={user.user_id} value={user.user_id.toString()}>
                                    {user.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Courses</Label>
                            <div className="col-span-3 max-h-40 overflow-y-auto space-y-2">
                              {courses.map((course) => {
                                const selected = pair.courses.find((c) => c.course_id === course.course_id)
                                return (
                                  <div key={course.course_id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`qc-course-${index}-${course.course_id}`}
                                      checked={!!selected}
                                      onCheckedChange={(checked: boolean | string) =>
                                        handleToggleCourseForUser(index, course.course_id, !!checked)
                                      }
                                    />
                                    <label
                                      htmlFor={`qc-course-${index}-${course.course_id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {course.course_name}
                                    </label>
                                    {selected && (
                                      <Input
                                        type="number"
                                        min={1}
                                        value={selected.validity_days}
                                        onChange={(e) =>
                                          handleUpdateCourseValidity(
                                            index,
                                            course.course_id,
                                            Number.parseInt(e.target.value) || 1,
                                          )
                                        }
                                        className="w-24 ml-2"
                                        placeholder="Validity (days)"
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveQCUserCourse(index)}
                          className="mt-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={handleAddQCUserCourse} className="w-full bg-transparent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      Add User-Course Pair
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateQCBatch}>Create QC Batch</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Generated Keys Section */}
            {generatedKeys.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Generated Keys:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-4">
                  {generatedKeys.map((key, index) => (
                    <div key={index} className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {key}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <Button onClick={handleDownloadKeys} disabled={generatedKeys.length === 0}>
                    Download Keys (CSV)
                  </Button>
                </div>
              </div>
            )}

            {/* Batch Analytics Tree View */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Batch and User Analytics</h3>
              {analyticsLoading ? (
                // Skeleton loader for tree view
                <div className="space-y-4">
                  {[...Array(3)].map((_, batchIndex) => (
                    <div key={batchIndex} className="border rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                      </div>
                      <div className="ml-4 mt-2 space-y-2">
                        {[...Array(2)].map((_, userIndex) => (
                          <div key={userIndex} className="border-t pt-2 space-y-2">
                            <div className="flex items-center justify-between w-full">
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            </div>
                            <div className="ml-4 mt-2 space-y-2">
                              {[...Array(1)].map((_, courseIndex) => (
                                <div key={courseIndex} className="border-t pt-2">
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-1"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/4 mt-1"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : analyticsError ? (
                <div className="text-red-500">{analyticsError}</div>
              ) : batchesData.length === 0 ? (
                <div className="text-gray-500">No batch data available.</div>
              ) : (
                <div className="space-y-4 text-gray-700">
                  {batchesData.map((batch) => (
                    <div
                      key={batch.batch_id}
                      className={`border rounded-md p-4 ${batch.is_root ? "bg-gray-100" : "bg-gray-50"}`}
                    >
                      <div
                        className="flex items-center justify-between w-full text-left font-semibold hover:text-gray-800 cursor-pointer"
                        onClick={() => toggleNode(`batch-${batch.batch_id}`)}
                      >
                        <span>
                          {expandedNodes.has(`batch-${batch.batch_id}`) ? (
                            <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-600" />
                          )}
                          {batch.is_root ? "▼ " : ""}
                          {batch.batch_name}{" "}
                          {!batch.is_root &&
                            `(${batch.users.length} Users, ${batch.users[0]?.courses?.length || 0} Courses per user)`}
                        </span>
                        {/* Action Buttons for Batch */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent toggling tree node
                              setCurrentBatch(batch)
                              setIsAddUsersDialogOpen(true)
                              setNumUsersToAdd("1") // Reset input
                              setGeneratedBatchKeys([]) // Clear previous generated keys
                              // Extract unique courses from the batch users
                              const uniqueCourseIds = new Set<number>()
                              batch.users.forEach((user: any) => {
                                if (user.courses && Array.isArray(user.courses)) {
                                  user.courses.forEach((course: any) => {
                                    if (course && course.course_id !== undefined && course.course_id !== null) {
                                      uniqueCourseIds.add(course.course_id)
                                    }
                                  })
                                }
                              })
                              // Filter the main courses list based on unique batch course IDs
                              const filteredBatchCourses = courses.filter((course) =>
                                uniqueCourseIds.has(course.course_id),
                              )
                              setBatchCourses(filteredBatchCourses)
                              console.log("Unique Course IDs from Batch:", uniqueCourseIds)
                              console.log("All available courses:", courses)
                              console.log("Filtered Batch Courses for Select:", filteredBatchCourses)
                            }}
                          >
                            Add Users
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent toggling tree node
                              setCurrentBatch(batch)
                              setIsExtendValidityDialogOpen(true)
                              setExtendValidityDays("30") // Reset input
                              setSelectedCourseForValidity(null) // Reset selection
                              console.log("Current Batch Data:", batch)
                              // Extract unique courses from the batch users
                              const uniqueCourseIds = new Set<number>()
                              batch.users.forEach((user: any) => {
                                if (user.courses && Array.isArray(user.courses)) {
                                  user.courses.forEach((course: any) => {
                                    if (course && course.course_id !== undefined && course.course_id !== null) {
                                      uniqueCourseIds.add(course.course_id)
                                    }
                                  })
                                }
                              })
                              // Filter the main courses list based on unique batch course IDs
                              const filteredBatchCourses = courses.filter((course) =>
                                uniqueCourseIds.has(course.course_id),
                              )
                              setBatchCourses(filteredBatchCourses)
                            }}
                          >
                            Extend Validity
                          </Button>
                        </div>
                      </div>
                      {expandedNodes.has(`batch-${batch.batch_id}`) && ( // Batch content
                        <div className={`mt-4 space-y-4 ${!batch.is_root ? "ml-6 border-l pl-4" : ""}`}>
                          {batch.is_root &&
                            batch.children &&
                            batch.children.map((childBatch: any) => (
                              <div key={childBatch.batch_id} className="border rounded-md p-4 bg-gray-50">
                                <div
                                  className="flex items-center justify-between w-full text-left font-semibold hover:text-gray-800 cursor-pointer"
                                  onClick={() => toggleNode(`batch-${childBatch.batch_id}`)}
                                >
                                  <span>
                                    {expandedNodes.has(`batch-${childBatch.batch_id}`) ? (
                                      <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-600" />
                                    )}
                                    Batch: {childBatch.batch_name} ({childBatch.users.length} Users,{" "}
                                    {childBatch.users[0]?.courses?.length || 0} Courses per user)
                                  </span>
                                  {/* Action Buttons for Batch */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCurrentBatch(childBatch)
                                        setIsAddUsersDialogOpen(true)
                                        setNumUsersToAdd("1")
                                        setGeneratedBatchKeys([])
                                        const uniqueCourseIds = new Set<number>()
                                        childBatch.users.forEach((user: any) => {
                                          if (user.courses && Array.isArray(user.courses)) {
                                            user.courses.forEach((course: any) => {
                                              if (
                                                course &&
                                                course.course_id !== undefined &&
                                                course.course_id !== null
                                              ) {
                                                uniqueCourseIds.add(course.course_id)
                                              }
                                            })
                                          }
                                        })
                                        const filteredBatchCourses = courses.filter((course) =>
                                          uniqueCourseIds.has(course.course_id),
                                        )
                                        setBatchCourses(filteredBatchCourses)
                                      }}
                                    >
                                      Add Users
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCurrentBatch(childBatch)
                                        setIsExtendValidityDialogOpen(true)
                                        setExtendValidityDays("30")
                                        setSelectedCourseForValidity(null)
                                        const uniqueCourseIds = new Set<number>()
                                        childBatch.users.forEach((user: any) => {
                                          if (user.courses && Array.isArray(user.courses)) {
                                            user.courses.forEach((course: any) => {
                                              if (
                                                course &&
                                                course.course_id !== undefined &&
                                                course.course_id !== null
                                              ) {
                                                uniqueCourseIds.add(course.course_id)
                                              }
                                            })
                                          }
                                        })
                                        const filteredBatchCourses = courses.filter((course) =>
                                          uniqueCourseIds.has(course.course_id),
                                        )
                                        setBatchCourses(filteredBatchCourses)
                                      }}
                                    >
                                      Extend Validity
                                    </Button>
                                  </div>
                                </div>
                                {expandedNodes.has(`batch-${childBatch.batch_id}`) && (
                                  <div className="ml-6 mt-4 space-y-4 border-l pl-4">
                                    {childBatch.users.map((user: any) => (
                                      <div key={user.username} className="border-b last:border-b-0 pb-4 space-y-3">
                                        <button
                                          onClick={() => toggleNode(`user-${childBatch.batch_id}-${user.username}`)}
                                          className="flex items-center justify-between w-full text-left font-medium hover:text-gray-700"
                                        >
                                          <span>
                                            {expandedNodes.has(`user-${childBatch.batch_id}-${user.username}`) ? (
                                              <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                            )}
                                            User: {user.username} ({user.courses.length} Courses)
                                          </span>
                                        </button>
                                        {expandedNodes.has(`user-${childBatch.batch_id}-${user.username}`) && (
                                          <div className="ml-6 mt-3 space-y-2 border-l pl-4 text-gray-600">
                                            {user.courses.map((course: any) => (
                                              <div
                                                key={course.course_name}
                                                className="border-b last:border-b-0 pb-3 text-sm space-y-1"
                                              >
                                                <div className="font-medium">Course: {course.course_name}</div>
                                                <div>
                                                  Enrollment Status:{" "}
                                                  <span className="font-normal">{course.enrollment_status}</span>
                                                </div>
                                                <div>
                                                  Completion Status:{" "}
                                                  <span className="font-normal">{course.completion_status}</span>
                                                </div>
                                                {course.validity !== undefined && course.updated_date && (
                                                  <BatchCourseValidityDisplay
                                                    validity={course.validity}
                                                    updatedDate={course.updated_date}
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          {!batch.is_root &&
                            batch.users.map((user: any) => (
                              <div key={user.username} className="border-b last:border-b-0 pb-4 space-y-3">
                                <button
                                  onClick={() => toggleNode(`user-${batch.batch_id}-${user.username}`)}
                                  className="flex items-center justify-between w-full text-left font-medium hover:text-gray-700"
                                >
                                  <span>
                                    {expandedNodes.has(`user-${batch.batch_id}-${user.username}`) ? (
                                      <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                    )}
                                    User: {user.username} ({user.courses.length} Courses)
                                  </span>
                                </button>
                                {expandedNodes.has(`user-${batch.batch_id}-${user.username}`) && ( // User content
                                  <div className="ml-6 mt-3 space-y-2 border-l pl-4 text-gray-600">
                                    {user.courses.map((course: any) => (
                                      <div
                                        key={course.course_name}
                                        className="border-b last:border-b-0 pb-3 text-sm space-y-1"
                                      >
                                        <div className="font-medium">Course: {course.course_name}</div>
                                        <div>
                                          Enrollment Status:{" "}
                                          <span className="font-normal">{course.enrollment_status}</span>
                                        </div>
                                        <div>
                                          Completion Status:{" "}
                                          <span className="font-normal">{course.completion_status}</span>
                                        </div>
                                        {/* Real-time validity countdown */}
                                        {course.validity !== undefined && course.updated_date && (
                                          <BatchCourseValidityDisplay
                                            validity={course.validity}
                                            updatedDate={course.updated_date}
                                          />
                                        )}
                                      </div>
                                    ))}{" "}
                                  </div>
                                )}{" "}
                              </div>
                            ))}{" "}
                        </div>
                      )}{" "}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Users to Batch Dialog */}
            <Dialog open={isAddUsersDialogOpen} onOpenChange={setIsAddUsersDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Users to Batch: {currentBatch?.batch_name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="numUsersToAdd" className="text-right">
                      Number of Users
                    </Label>
                    <Input
                      id="numUsersToAdd"
                      type="number"
                      value={numUsersToAdd}
                      onChange={(e) => setNumUsersToAdd(e.target.value)}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                  {generatedBatchKeys.length > 0 && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Generated Keys</Label>
                      <div className="col-span-3 max-h-40 overflow-y-auto space-y-2 border rounded-md p-2 w-full">
                        {generatedBatchKeys.map((key, index) => (
                          <div
                            key={index}
                            className="font-mono text-sm bg-gray-100 p-1 rounded break-all flex items-center justify-between"
                          >
                            <span>{key}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(key)}
                              title="Copy key"
                            >
                              <CopyIcon className="h-4 w-4 text-gray-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddUsersToBatch}
                    disabled={isLoading || Number.parseInt(numUsersToAdd, 10) <= 0 || !currentBatch}
                  >
                    {isLoading ? "Generating..." : "Generate Keys"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Extend Validity Dialog */}
            <Dialog open={isExtendValidityDialogOpen} onOpenChange={setIsExtendValidityDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Extend Validity for Batch: {currentBatch?.batch_name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="extendValidityDays" className="text-right">
                      Extend By (Days)
                    </Label>
                    <Input
                      id="extendValidityDays"
                      type="number"
                      value={extendValidityDays}
                      onChange={(e) => setExtendValidityDays(e.target.value)}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="selectCourseForValidity" className="text-right">
                      Select Course
                    </Label>
                    <Select
                      value={selectedCourseForValidity?.toString() || ""}
                      onValueChange={(value) => setSelectedCourseForValidity(Number.parseInt(value, 10))}
                    >
                      <SelectTrigger id="selectCourseForValidity" className="col-span-3">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent style={{ maxHeight: "200px", overflowY: "auto", paddingBottom: "8px" }}>
                        {/* Use the filtered batchCourses state */}
                        {batchCourses.map((course: any) => (
                          <SelectItem key={course.course_id} value={course.course_id.toString()}>
                            {course.course_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleExtendValidity}
                    disabled={
                      isLoading ||
                      Number.parseInt(extendValidityDays, 10) <= 0 ||
                      selectedCourseForValidity === null ||
                      !currentBatch
                    }
                  >
                    {isLoading ? "Extending..." : "Extend Validity"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* QC Batch Analytics Tree View */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">QC Batch Analytics</h3>
            {qcAnalyticsLoading ? (
              // Skeleton loader for QC tree view
              <div className="space-y-4">
                {[...Array(3)].map((_, batchIndex) => (
                  <div key={batchIndex} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                    </div>
                    <div className="ml-4 mt-2 space-y-2">
                      {[...Array(2)].map((_, userIndex) => (
                        <div key={userIndex} className="border-t pt-2 space-y-2">
                          <div className="flex items-center justify-between w-full">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          </div>
                          <div className="ml-4 mt-2 space-y-2">
                            {[...Array(1)].map((_, courseIndex) => (
                              <div key={courseIndex} className="border-t pt-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/3 mt-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4 mt-1"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : qcAnalyticsError ? (
              <div className="text-red-500">{qcAnalyticsError}</div>
            ) : qcBatchesData.length === 0 ? (
              <div className="text-gray-500">No QC batch data available.</div>
            ) : (
              <div className="space-y-4 text-gray-700">
                {qcBatchesData.map((batch) => (
                  <div
                    key={batch.qc_id}
                    className={`border rounded-md p-4 ${batch.is_root ? "bg-gray-100" : "bg-gray-50"}`}
                  >
                    <div
                      className="flex items-center justify-between w-full text-left font-semibold hover:text-gray-800 cursor-pointer"
                      onClick={() => toggleNode(`qc-batch-${batch.qc_id}`)}
                    >
                      <span>
                        {expandedNodes.has(`qc-batch-${batch.qc_id}`) ? (
                          <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-600" />
                        )}
                        {batch.is_root ? "▼ " : ""}
                        {batch.batch_name} {!batch.is_root && `(${batch.users.length} Users)`}
                      </span>
                    </div>
                    {expandedNodes.has(`qc-batch-${batch.qc_id}`) && (
                      <div className={`mt-4 space-y-4 ${!batch.is_root ? "ml-6 border-l pl-4" : ""}`}>
                        {batch.is_root &&
                          batch.children &&
                          batch.children.map((childBatch: any) => (
                            <div key={childBatch.qc_id} className="border rounded-md p-4 bg-gray-50">
                              <div
                                className="flex items-center justify-between w-full text-left font-semibold hover:text-gray-800 cursor-pointer"
                                onClick={() => toggleNode(`qc-batch-${childBatch.qc_id}`)}
                              >
                                <span>
                                  {expandedNodes.has(`qc-batch-${childBatch.qc_id}`) ? (
                                    <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-600" />
                                  )}
                                  Batch: {childBatch.batch_name} ({childBatch.users.length} Users)
                                </span>
                              </div>
                              {expandedNodes.has(`qc-batch-${childBatch.qc_id}`) && (
                                <div className="ml-6 mt-4 space-y-4 border-l pl-4">
                                  {childBatch.users.map((user: any) => (
                                    <div key={user.username} className="border-b last:border-b-0 pb-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <button
                                          onClick={() => toggleNode(`qc-user-${childBatch.qc_id}-${user.username}`)}
                                          className="flex items-center justify-between w-full text-left font-medium hover:text-gray-700"
                                        >
                                          <span>
                                            {expandedNodes.has(`qc-user-${childBatch.qc_id}-${user.username}`) ? (
                                              <ChevronDown className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 inline-block mr-1 text-gray-500" />
                                            )}
                                            User: {user.username} ({user.courses.length} Courses)
                                          </span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setCurrentQCUser(user)
                                              setCurrentQCBatch(childBatch) // Set currentQCBatch here
                                              setIsAddQCCourseDialogOpen(true)
                                              setSelectedCourseToAddQC(null)
                                              setValidityDaysAddQCCourse("30")
                                            }}
                                          >
                                            Add Course
                                          </Button>
                                        </div>
                                      </div>
                                      {expandedNodes.has(`qc-user-${childBatch.qc_id}-${user.username}`) && (
                                        <div className="ml-6 mt-3 space-y-2 border-l pl-4 text-gray-600">
                                          {user.courses.map((course: any) => (
                                            <div
                                              key={course.course_name}
                                              className="border-b last:border-b-0 pb-3 text-sm space-y-1"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="font-medium">Course: {course.course_name}</div>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setCurrentQCUser(user)
                                                    setCurrentQCBatch(childBatch) // Set currentQCBatch here
                                                    setSelectedCourseToExtendQC(course.course_id)
                                                    setIsExtendQCCourseValidityDialogOpen(true)
                                                    setExtendValidityDaysQC("30")
                                                  }}
                                                >
                                                  Extend Validity
                                                </Button>
                                              </div>
                                              <div>
                                                Enrollment Status:{" "}
                                                <span className="font-normal">{course.enrollment_status}</span>
                                              </div>
                                              <div>
                                                Completion Status:{" "}
                                                <span className="font-normal">{course.completion_status}</span>
                                              </div>
                                              {course.validity !== undefined && course.updated_date && (
                                                <BatchCourseValidityDisplay
                                                  validity={course.validity}
                                                  updatedDate={course.updated_date}
                                                />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add QC Course Dialog */}
          <Dialog open={isAddQCCourseDialogOpen} onOpenChange={setIsAddQCCourseDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Course for User: {currentQCUser?.username}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selectCourseToAddQC" className="text-right">
                    Select Course
                  </Label>
                  <Select
                    value={selectedCourseToAddQC?.toString() || ""}
                    onValueChange={(value) => setSelectedCourseToAddQC(Number.parseInt(value, 10))}
                  >
                    <SelectTrigger id="selectCourseToAddQC" className="col-span-3">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent style={{ maxHeight: "200px", overflowY: "auto", paddingBottom: "8px" }}>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={course.course_id.toString()}>
                          {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="validityDaysAddQCCourse" className="text-right">
                    Validity (Days)
                  </Label>
                  <Input
                    id="validityDaysAddQCCourse"
                    type="number"
                    value={validityDaysAddQCCourse}
                    onChange={(e) => setValidityDaysAddQCCourse(e.target.value)}
                    className="col-span-3"
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddQCCourse}
                  disabled={isLoading || !selectedCourseToAddQC || Number.parseInt(validityDaysAddQCCourse, 10) <= 0}
                >
                  {isLoading ? "Adding..." : "Add Course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Extend QC Course Validity Dialog */}
          <Dialog open={isExtendQCCourseValidityDialogOpen} onOpenChange={setIsExtendQCCourseValidityDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Extend Course Validity for User: {currentQCUser?.username}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="extendValidityDaysQC" className="text-right">
                    Extend By (Days)
                  </Label>
                  <Input
                    id="extendValidityDaysQC"
                    type="number"
                    value={extendValidityDaysQC}
                    onChange={(e) => setExtendValidityDaysQC(e.target.value)}
                    className="col-span-3"
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleExtendQCCourseValidity}
                  disabled={isLoading || Number.parseInt(extendValidityDaysQC, 10) <= 0}
                >
                  {isLoading ? "Extending..." : "Extend Validity"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="courses">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Courses Management</h2>
                <p className="text-gray-600 mt-1">Create, manage, and monitor all courses</p>
              </div>
              <Dialog open={isCreateCourseDialogOpen} onOpenChange={setIsCreateCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  {/* Header with Step Indicator */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <DialogTitle className="text-2xl font-bold text-gray-900">Create New Course</DialogTitle>
                        <p className="text-sm text-gray-600 mt-1">Complete all steps to create your course</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Step {currentStep} of 3
                        </span>
                      </div>
                    </div>

                    {/* Step Progress Indicator */}
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center flex-1">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                              step < currentStep
                                ? "bg-green-500 text-white"
                                : step === currentStep
                                  ? "bg-blue-600 text-white ring-2 ring-blue-300"
                                  : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {step < currentStep ? (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              step
                            )}
                          </div>
                          {step < 3 && (
                            <div
                              className={`flex-1 h-1 mx-2 rounded transition-all ${
                                step < currentStep ? "bg-green-500" : "bg-gray-200"
                              }`}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Step Labels */}
                    <div className="flex justify-between mt-4 text-xs font-medium">
                      <span className={currentStep >= 1 ? "text-blue-600" : "text-gray-500"}>Basic Info</span>
                      <span className={currentStep >= 2 ? "text-blue-600" : "text-gray-500"}>Details</span>
                      <span className={currentStep >= 3 ? "text-blue-600" : "text-gray-500"}>Content</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="px-6 py-6">
                    <div className="space-y-6">
                      {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="course-name" className="text-sm font-semibold text-gray-700">
                                Course Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="course-name"
                                placeholder="e.g., Advanced React Development"
                                value={courseData.course_name}
                                onChange={(e) => setCourseData({ ...courseData, course_name: e.target.value })}
                                aria-invalid={!!formErrors.course_name}
                                className="h-10"
                              />
                              {formErrors.course_name && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <text
                                      x="12"
                                      y="16"
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize="12"
                                      fontWeight="bold"
                                    >
                                      !
                                    </text>
                                  </svg>
                                  {formErrors.course_name}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="course-type" className="text-sm font-semibold text-gray-700">
                                Course Type <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={courseData.course_type}
                                onValueChange={(value) => setCourseData({ ...courseData, course_type: value })}
                              >
                                <SelectTrigger aria-invalid={!!formErrors.course_type} className="h-10">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                              {formErrors.course_type && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.course_type}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="course-description" className="text-sm font-semibold text-gray-700">
                              Short Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="course-description"
                              placeholder="Brief overview of what students will learn"
                              value={courseData.course_short_description}
                              onChange={(e) =>
                                setCourseData({ ...courseData, course_short_description: e.target.value })
                              }
                              aria-invalid={!!formErrors.course_short_description}
                              className="min-h-[80px] resize-none"
                            />
                            {formErrors.course_short_description && (
                              <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                                {formErrors.course_short_description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="language" className="text-sm font-semibold text-gray-700">
                                Language <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="language"
                                placeholder="e.g., English"
                                value={courseData.language}
                                onChange={(e) => setCourseData({ ...courseData, language: e.target.value })}
                                aria-invalid={!!formErrors.language}
                                className="h-10"
                              />
                              {formErrors.language && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.language}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="duration-hours" className="text-sm font-semibold text-gray-700">
                                Duration (Hours) <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="duration-hours"
                                type="number"
                                placeholder="0"
                                value={String(courseData.course_duration_hours)}
                                onChange={(e) =>
                                  setCourseData({
                                    ...courseData,
                                    course_duration_hours: Number.parseInt(e.target.value),
                                  })
                                }
                                aria-invalid={!!formErrors.course_duration_hours}
                                className="h-10"
                              />
                              {formErrors.course_duration_hours && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.course_duration_hours}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="duration-minutes" className="text-sm font-semibold text-gray-700">
                                Duration (Minutes) <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="duration-minutes"
                                type="number"
                                placeholder="0"
                                value={String(courseData.course_duration_minutes)}
                                onChange={(e) =>
                                  setCourseData({
                                    ...courseData,
                                    course_duration_minutes: Number.parseInt(e.target.value),
                                  })
                                }
                                aria-invalid={!!formErrors.course_duration_minutes}
                                className="h-10"
                              />
                              {formErrors.course_duration_minutes && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.course_duration_minutes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="space-y-2">
                            <Label htmlFor="detailed-description" className="text-sm font-semibold text-gray-700">
                              Detailed Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="detailed-description"
                              placeholder="Provide a comprehensive description of the course content"
                              value={courseData.course_description}
                              onChange={(e) => setCourseData({ ...courseData, course_description: e.target.value })}
                              aria-invalid={!!formErrors.course_description}
                              className="min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-gray-500">Minimum 100 characters required</p>
                            {formErrors.course_description && (
                              <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                                {formErrors.course_description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="objectives" className="text-sm font-semibold text-gray-700">
                                Course Objectives <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                id="objectives"
                                placeholder="What will students achieve after completing this course?"
                                value={courseData.course_objective}
                                onChange={(e) => setCourseData({ ...courseData, course_objective: e.target.value })}
                                aria-invalid={!!formErrors.course_objective}
                                className="min-h-[100px] resize-none"
                              />
                              {formErrors.course_objective && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.course_objective}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prerequisites" className="text-sm font-semibold text-gray-700">
                                Prerequisites <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                id="prerequisites"
                                placeholder="What should students know before taking this course?"
                                value={courseData.pre_requirments}
                                onChange={(e) => setCourseData({ ...courseData, pre_requirments: e.target.value })}
                                aria-invalid={!!formErrors.pre_requirments}
                                className="min-h-[100px] resize-none"
                              />
                              {formErrors.pre_requirments && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.pre_requirments}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="course-level" className="text-sm font-semibold text-gray-700">
                                Course Level <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={courseData.course_level}
                                onValueChange={(value) => setCourseData({ ...courseData, course_level: value })}
                              >
                                <SelectTrigger aria-invalid={!!formErrors.course_level} className="h-10">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Beginner">Beginner</SelectItem>
                                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                                  <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              {formErrors.course_level && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.course_level}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="enrollment-type" className="text-sm font-semibold text-gray-700">
                                Enrollment Type <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={courseData.enrollment_type}
                                onValueChange={(value) => setCourseData({ ...courseData, enrollment_type: value })}
                              >
                                <SelectTrigger aria-invalid={!!formErrors.enrollment_type} className="h-10">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                              {formErrors.enrollment_type && (
                                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  {formErrors.enrollment_type}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-blue-600"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              Choose Content Method
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Select how you want to create your course content
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                variant={step3Mode === "upload" ? "default" : "outline"}
                                onClick={() => setStep3Mode("upload")}
                                className="flex-1 gap-2 h-10"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="17 8 12 3 7 8"></polyline>
                                  <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                Upload Excel
                              </Button>
                              <Button
                                variant={step3Mode === "generate" ? "default" : "outline"}
                                onClick={() => setStep3Mode("generate")}
                                className="flex-1 gap-2 h-10"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 2v20M2 12h20"></path>
                                </svg>
                                Generate with AI
                              </Button>
                            </div>
                          </div>

                          {/* Upload Mode */}
                          {step3Mode === "upload" && (
                            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="space-y-2">
                                <Label htmlFor="course-content" className="text-sm font-semibold text-gray-700">
                                  Upload Excel File <span className="text-red-500">*</span>
                                </Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                                  <Input
                                    id="course-content"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    aria-invalid={!!formErrors.selectedFile}
                                    className="hidden"
                                  />
                                  <label htmlFor="course-content" className="cursor-pointer block">
                                    <svg
                                      width="32"
                                      height="32"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="mx-auto mb-2 text-gray-400"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="17 8 12 3 7 8"></polyline>
                                      <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <p className="text-sm font-medium text-gray-700">
                                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Excel files (.xlsx, .xls)</p>
                                  </label>
                                </div>
                                {formErrors.selectedFile && (
                                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                    {formErrors.selectedFile}
                                  </p>
                                )}
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Required Columns:</p>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <code className="bg-white px-2 py-1 rounded text-xs border border-blue-200 text-blue-600 font-mono">
                                    course_id
                                  </code>
                                  <code className="bg-white px-2 py-1 rounded text-xs border border-blue-200 text-blue-600 font-mono">
                                    course_mastertitle_breakdown_id
                                  </code>
                                  <code className="bg-white px-2 py-1 rounded text-xs border border-blue-200 text-blue-600 font-mono">
                                    course_subtitle_id
                                  </code>
                                </div>
                                <button
                                  type="button"
                                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                                  onClick={() => {
                                    const header = [
                                      "course_id",
                                      "course_mastertitle_breakdown_id",
                                      "course_subtitle_id",
                                    ]
                                    const csvContent = header.join(",") + "\n"
                                    const blob = new Blob([csvContent], { type: "text/csv" })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = "course_content_template.csv"
                                    a.click()
                                    URL.revokeObjectURL(url)
                                  }}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <path d="M7 10 12 15 17 10"></path>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  Download Template
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Generate Mode */}
                          {step3Mode === "generate" && (
                            <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start gap-3">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-blue-600 mt-0.5 flex-shrink-0"
                                >
                                  <path d="M12 2v20M2 12h20"></path>
                                </svg>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">AI-Powered Syllabus Generation</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Click the button below to generate a comprehensive course syllabus using AI based on
                                    your course details
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={handleGenerateContent}
                                disabled={isLoading}
                                className="w-full gap-2 h-10 bg-blue-600 hover:bg-blue-700"
                              >
                                {isLoading ? (
                                  <>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="animate-spin"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <path d="M12 6v6l4 2"></path>
                                    </svg>
                                    Generating Syllabus...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M12 2v20M2 12h20"></path>
                                    </svg>
                                    Generate Syllabus
                                  </>
                                )}
                              </Button>
                              {streamError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="text-red-600 mt-0.5 flex-shrink-0"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                  </svg>
                                  <p className="text-xs text-red-700">{streamError}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Syllabus Preview */}
                          {(parsedSyllabus || isLoading) && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-blue-600"
                                  >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                  </svg>
                                  Generated Syllabus Preview
                                </h4>
                                {parsedSyllabus && !isEditingJson && (
                                  <button
                                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                                    title="Edit JSON"
                                    onClick={() => {
                                      setIsEditingJson(true)
                                      setJsonEditValue(JSON.stringify(parsedSyllabus, null, 2))
                                      setJsonEditError("")
                                    }}
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <div className="p-4 max-h-[400px] overflow-y-auto">
                                {isEditingJson ? (
                                  <div className="space-y-3">
                                    <textarea
                                      className="w-full h-64 p-3 font-mono text-xs border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      value={jsonEditValue}
                                      onChange={(e) => setJsonEditValue(e.target.value)}
                                      spellCheck={false}
                                      autoFocus
                                    />
                                    {jsonEditError && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                          className="text-red-600 mt-0.5 flex-shrink-0"
                                        >
                                          <circle cx="12" cy="12" r="10"></circle>
                                        </svg>
                                        <p className="text-xs text-red-700">{jsonEditError}</p>
                                      </div>
                                    )}
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        onClick={() => {
                                          try {
                                            const parsed = JSON.parse(jsonEditValue)
                                            if (
                                              !parsed.course_mastertitle_breakdown ||
                                              !Array.isArray(parsed.course_mastertitle_breakdown) ||
                                              !parsed.course_mastertitle_breakdown.every(
                                                (m: any) =>
                                                  typeof m.master_title === "string" &&
                                                  Array.isArray(m.subtitles) &&
                                                  m.subtitles.every((s: any) => typeof s === "string"),
                                              )
                                            ) {
                                              setJsonEditError(
                                                "Invalid structure: Must have course_mastertitle_breakdown as an array of { master_title, subtitles[] }.",
                                              )
                                              return
                                            }
                                            setParsedSyllabus(parsed)
                                            setIsEditingJson(false)
                                            setJsonEditError("")
                                          } catch (e: any) {
                                            setJsonEditError("Invalid JSON: " + e.message)
                                          }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                                      >
                                        Save Changes
                                      </Button>
                                      <Button variant="outline" onClick={() => setIsEditingJson(false)} className="h-9">
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {isLoading && (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                          <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="animate-spin mx-auto mb-2 text-blue-600"
                                          >
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M12 6v6l4 2"></path>
                                          </svg>
                                          <p className="text-sm text-gray-600">Generating your syllabus...</p>
                                        </div>
                                      </div>
                                    )}
                                    {!isLoading && !parsedSyllabus && (
                                      <div className="text-center py-8">
                                        <svg
                                          width="32"
                                          height="32"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          className="mx-auto mb-2 text-gray-400"
                                        >
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        <p className="text-sm text-gray-500">No syllabus generated yet</p>
                                      </div>
                                    )}
                                    {parsedSyllabus && parsedSyllabus.course_mastertitle_breakdown && (
                                      <div className="space-y-4">
                                        {parsedSyllabus.course_mastertitle_breakdown.map((module: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                          >
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                                                {idx + 1}
                                              </span>
                                              {module.master_title}
                                            </h5>
                                            <ul className="space-y-2">
                                              {module.subtitles.map((subtitle: string, subIdx: number) => (
                                                <li
                                                  key={subIdx}
                                                  className="flex items-start gap-2 text-sm text-gray-700"
                                                >
                                                  <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="text-green-600 mt-0.5 flex-shrink-0"
                                                  >
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                  </svg>
                                                  {subtitle}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with Navigation Buttons */}
                  <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between gap-3">
                    <div>
                      {currentStep > 1 && (
                        <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                          </svg>
                          Previous
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsCreateCourseDialogOpen(false)} className="gap-2">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCourseCreation}
                        disabled={isLoading}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="animate-spin"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                            Processing...
                          </>
                        ) : currentStep === 3 && step3Mode === "generate" ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 2v20M2 12h20"></path>
                            </svg>
                            Create & Generate
                          </>
                        ) : currentStep === 3 ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Create Course
                          </>
                        ) : (
                          <>
                            Next
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{coursesLoading ? "..." : courses.length}</div>
                    <p className="text-xs text-muted-foreground">Active courses in the system</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Free Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {coursesLoading ? "..." : courses.filter((c) => c.course_type.toLowerCase() === "free").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Available free courses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {coursesLoading ? "..." : courses.filter((c) => c.course_type.toLowerCase() === "premium").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Available premium courses</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Course List</h3>
                {coursesLoading ? (
                  <div>Loading courses...</div>
                ) : coursesError ? (
                  <div className="text-red-500">{coursesError}</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses.length === 0 ? (
                      <div className="col-span-full text-center text-gray-500">No courses found.</div>
                    ) : (
                      courses.map((course) => (
                        <Card key={course.course_id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold line-clamp-1">{course.course_name}</h4>
                              <Badge variant={course.course_type.toLowerCase() === "free" ? "secondary" : undefined}>
                                {course.course_type.charAt(0).toUpperCase() + course.course_type.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-3">{course.course_short_description}</p>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>
                                {course.course_duration_hours}h {course.course_duration_minutes}m
                              </span>
                              <span>⭐ {course.rating}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* Yet to Approve Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Yet to Approve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pending Course Approvals</h3>
                {pendingCoursesLoading ? (
                  <div>Loading pending courses...</div>
                ) : pendingCoursesError ? (
                  <div className="text-red-500">{pendingCoursesError}</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingCourses.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12">
                        <div className="mb-4">
                          {/* You can use an SVG, an icon from your icon set, or an image */}
                          <svg width="64" height="64" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="#F3F4F6" />
                            <path
                              d="M8 12l2 2 4-4"
                              stroke="#22C55E"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="text-lg font-semibold text-gray-700 mb-1">All Set!</div>
                        <div className="text-gray-500">
                          All courses are up to date. No pending approvals at the moment.
                        </div>
                      </div>
                    ) : (
                      pendingCourses.map((course) => (
                        <Card key={course.course_id} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold line-clamp-1">{course.course_name}</h4>
                              {course.course_type && (
                                <Badge variant={course.course_type.toLowerCase() === "free" ? "secondary" : undefined}>
                                  {course.course_type.charAt(0).toUpperCase() + course.course_type.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-3">{course.course_short_description}</p>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                              <span>
                                {course.course_duration_hours}h {course.course_duration_minutes}m
                              </span>
                              {course.rating && <span>⭐ {course.rating}</span>}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Content Generation Progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    course.progress === 100 ? "bg-green-500" : "bg-orange-500"
                                  }`}
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Status and Actions */}
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-600">
                                {course.latest_status === "completed" ? (
                                  <span className="text-green-600 font-medium">✓ Ready for Approval</span>
                                ) : (
                                  <span className="text-orange-600 font-medium">⏳ Generating Content</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewDetails(course)}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Course Details: {detailsCourse?.course_name}</DialogTitle>
              </DialogHeader>
              {detailsLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <div className="mb-4">
                    <div>
                      <b>Course Name:</b> {detailsCourse?.course_name}
                    </div>
                    <div>
                      <b>Description:</b> {detailsCourse?.course_short_description}
                    </div>
                    <div>
                      <b>Duration:</b> {detailsCourse?.course_duration_hours}h {detailsCourse?.course_duration_minutes}m
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownloadCourseContent}
                      disabled={detailsCourse?.progress !== 100 || detailsLoading}
                    >
                      Download Course Content
                    </Button>
                    <Button
                      onClick={handleDownloadQuestions}
                      disabled={detailsCourse?.progress !== 100 || detailsLoading}
                    >
                      Download Questions
                    </Button>
                    <Button onClick={handleApproveCourse} disabled={detailsCourse?.progress !== 100 || detailsLoading}>
                      Approve
                    </Button>
                  </div>
                  <div className="mt-4 max-h-60 overflow-auto">
                    <b>Preview:</b>
                    {detailsContent.length === 0 ? (
                      <div className="text-gray-500">No content found.</div>
                    ) : (
                      <table className="min-w-full text-xs border mt-2">
                        <thead>
                          <tr>
                            <th className="border px-2">Master Title</th>
                            <th className="border px-2">Subtitle</th>
                            <th className="border px-2">Content</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsContent.map((row, idx) => (
                            <tr key={idx}>
                              <td className="border px-2">{row.course_mastertitle_breakdown}</td>
                              <td className="border px-2">{row.course_subtitle}</td>
                              <td className="border px-2">{row.subtitle_content?.slice(0, 60)}...</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Settings content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
