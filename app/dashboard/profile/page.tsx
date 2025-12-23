"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader } from "@/components/loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  User,
  Briefcase,
  MapPin,
  GraduationCap,
  Mail,
  Smartphone,
  Globe,
  Target,
  Award,
  Star,
  Book,
  Edit,
  X,
  Save,
  Calendar,
  Clock,
  BookOpen,
  Linkedin,
  Github,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react"

interface UserDetails {
  user_id: number
  user_name: string
  designation: string
  current_organization: string
  city: string
  highest_qualification: string
  year_of_passedout: string
  mail_id: string
  mobile_number: string
  portfolio_website: string
  linkedin_profile: string
  github_profile: string
  ambition: string
  work_experience: number
  area_of_interest: string
  age: number
  job_title: string
}

interface Certificate {
  certificate_id: number
  certificate_name: string
  certification_level: string
  enrollment_date: string
}

interface Badge {
  badge_id: number
  badge_name: string
  badge_type: string
  badge_level: string
  earned_date: string
}

interface Course {
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
}

interface ValidationError {
  field: string
  message: string
}

export default function ProfilePage() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [userBadges, setUserBadges] = useState<Badge[]>([])
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UserDetails | null>(null)
  const { toast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)

  const calculateProfileCompletion = (details: UserDetails | null): number => {
    if (!details) return 0
    const fields = [
      details.user_name,
      details.designation,
      details.current_organization,
      details.city,
      details.highest_qualification,
      details.mail_id,
      details.mobile_number,
      details.job_title,
      details.age,
    ]
    const filledFields = fields.filter((field) => field && String(field).trim() !== "0").length
    return Math.round((filledFields / fields.length) * 100)
  }

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem("user") || "{}")

        const response = await api.post("/userdetails", {
          user_id: user.user_id,
        })

        const userDetailsFromApi = response.data?.user_details?.user_details

        if (userDetailsFromApi) {
          setUserDetails(userDetailsFromApi)
          setEditData(null)
          setIsEditing(false)
        } else {
          const emptyUserDetails = {
            user_id: user.user_id,
            user_name: "",
            designation: "",
            current_organization: "",
            city: "",
            highest_qualification: "",
            year_of_passedout: "",
            mail_id: "",
            mobile_number: "",
            portfolio_website: "",
            linkedin_profile: "",
            github_profile: "",
            ambition: "",
            work_experience: 0,
            area_of_interest: "",
            age: 0,
            job_title: "",
          }
          setUserDetails(null)
          setEditData(emptyUserDetails)
          setIsEditing(true)
        }

        setUserCourses(response.data?.user_details?.enrolled_courses || [])
        setUserBadges(response.data?.user_details?.user_badges || [])
        setUserCertificates(response.data?.user_details?.user_certifications || [])
      } catch (error) {
        console.error("Error fetching user details:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [toast])

  const validateUserDetails = (data: Partial<UserDetails>): ValidationError[] => {
    const errors: ValidationError[] = []

    const requiredFields = [
      { field: "user_name", label: "Full Name" },
      { field: "designation", label: "Designation" },
      { field: "highest_qualification", label: "Qualification" },
      { field: "mail_id", label: "Email" },
      { field: "mobile_number", label: "Mobile Number" },
      { field: "age", label: "Age" },
      { field: "job_title", label: "Job Title" },
    ]

    requiredFields.forEach(({ field, label }) => {
      const value = data[field as keyof UserDetails]
      if (!value || (typeof value === "string" && !value.trim())) {
        errors.push({
          field,
          message: `${label} is required`,
        })
      }
    })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (data.mail_id && !emailRegex.test(data.mail_id)) {
      errors.push({
        field: "mail_id",
        message: "Please enter a valid email address",
      })
    }

    const mobileRegex = /^\d{10}$/
    if (data.mobile_number && !mobileRegex.test(data.mobile_number)) {
      errors.push({
        field: "mobile_number",
        message: "Please enter a valid 10-digit mobile number",
      })
    }

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    if (data.portfolio_website && !urlRegex.test(data.portfolio_website)) {
      errors.push({
        field: "portfolio_website",
        message: "Please enter a valid website URL",
      })
    }
    if (data.linkedin_profile && !urlRegex.test(data.linkedin_profile)) {
      errors.push({
        field: "linkedin_profile",
        message: "Please enter a valid LinkedIn URL",
      })
    }
    if (data.github_profile && !urlRegex.test(data.github_profile)) {
      errors.push({
        field: "github_profile",
        message: "Please enter a valid GitHub URL",
      })
    }

    if (data.work_experience && (isNaN(Number(data.work_experience)) || Number(data.work_experience) < 0)) {
      errors.push({
        field: "work_experience",
        message: "Work experience must be a valid number of years",
      })
    }

    if (data.age !== undefined) {
      const age = Number(data.age)
      if (isNaN(age) || age < 18 || age > 100) {
        errors.push({
          field: "age",
          message: "Age must be between 18 and 100",
        })
      }
    }

    return errors
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editData) return

    const value =
      e.target.type === "number" ? (e.target.value === "" ? 0 : Number.parseInt(e.target.value, 10)) : e.target.value

    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }))

    setEditData({
      ...editData,
      [e.target.name]: value,
    })
  }

  const handleSave = async () => {
    if (!editData) return

    const validationErrors = validateUserDetails(editData)

    if (validationErrors.length > 0) {
      const newFieldErrors: Record<string, string> = {}
      validationErrors.forEach((error) => {
        newFieldErrors[error.field] = error.message
      })
      setFieldErrors(newFieldErrors)

      toast({
        title: "Validation Error",
        description: validationErrors[0].message,
        variant: "destructive",
      })
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      const dataToSend = {
        ...editData,
        user_id: user.user_id,
        work_experience:
          typeof editData.work_experience === "string"
            ? Number.parseInt(editData.work_experience, 10) || 0
            : editData.work_experience || 0,
        age: typeof editData.age === "string" ? Number.parseInt(editData.age, 10) || 0 : editData.age || 0,
      }

      const response = await api.put("/userdetails/update", dataToSend)

      if (
        response.data?.message?.toLowerCase().includes("success") ||
        response.data?.status === "success" ||
        response.data?.user_details
      ) {
        const updatedUserDetails = response.data?.user_details || dataToSend

        setUserDetails(updatedUserDetails)
        setEditData(null)
        setFieldErrors({})
        setIsEditing(false)

        toast({
          title: "Success",
          description: response.data?.message || "Profile updated successfully",
        })

        try {
          const refreshResponse = await api.post("/userdetails", {
            user_id: user.user_id,
          })

          if (refreshResponse.data?.user_details?.user_details) {
            const refreshedData = refreshResponse.data.user_details
            setUserDetails(refreshedData.user_details)
            setUserCourses(refreshedData.enrolled_courses || [])
            setUserBadges(refreshedData.user_badges || [])
            setUserCertificates(refreshedData.user_certifications || [])
          }
        } catch (refreshError) {
          console.error("Error refreshing data:", refreshError)
        }
      } else if (response.data?.error) {
        throw new Error(response.data.error)
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      if (!error.message?.toLowerCase().includes("success")) {
        setIsEditing(true)
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      } else {
        setUserDetails(editData)
        setEditData(null)
        setFieldErrors({})
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (userDetails) {
      setEditData(null)
      setIsEditing(false)
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const emptyUserDetails = {
        user_id: user.user_id,
        user_name: "",
        designation: "",
        current_organization: "",
        city: "",
        highest_qualification: "",
        year_of_passedout: "",
        mail_id: "",
        mobile_number: "",
        portfolio_website: "",
        linkedin_profile: "",
        github_profile: "",
        ambition: "",
        work_experience: 0,
        area_of_interest: "",
        age: 0,
        job_title: "",
      }
      setEditData(emptyUserDetails)
      setIsEditing(true)
    }
    setFieldErrors({})
  }

  const handleEditClick = () => {
    if (userDetails) {
      setEditData(userDetails)
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const emptyUserDetails = {
        user_id: user.user_id,
        user_name: "",
        designation: "",
        current_organization: "",
        city: "",
        highest_qualification: "",
        year_of_passedout: "",
        mail_id: "",
        mobile_number: "",
        portfolio_website: "",
        linkedin_profile: "",
        github_profile: "",
        ambition: "",
        work_experience: 0,
        area_of_interest: "",
        age: 0,
        job_title: "",
      }
      setEditData(emptyUserDetails)
    }
    setFieldErrors({})
    setIsEditing(true)
  }

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate)
    setIsCertificateModalOpen(true)
  }

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      canvas.width = 1123
      canvas.height = 794

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 30
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)

      const contentPadding = 60
      const contentWidth = canvas.width - 2 * contentPadding
      const contentHeight = canvas.height - 4 * contentPadding
      const contentX = contentPadding
      const contentY = contentPadding

      const centeredText = (text: string, y: number, color: string, font: string) => {
        ctx.fillStyle = color
        ctx.font = font
        ctx.textAlign = "center"
        ctx.fillText(text, canvas.width / 2, y)
      }

      centeredText("Companian", contentY + 100, "#2563eb", "bold 60px Arial")
      centeredText("Powered by FrameFlow", contentY + 150, "#4b5563", "28px Arial")

      centeredText("This is to certify that", contentY + 250, "#1f2937", "28px Arial")
      centeredText(userDetails?.user_name || "", contentY + 310, "#1f2937", "bold 48px Arial")
      centeredText("has successfully completed the course", contentY + 370, "#1f2937", "28px Arial")

      centeredText(certificate.certificate_name, contentY + 450, "#2563eb", "bold 44px Arial")
      centeredText(`Level: ${certificate.certification_level}`, contentY + 500, "#4b5563", "28px Arial")

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, "image/png")
      })

      if (!blob) throw new Error("Failed to generate certificate image")

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${certificate.certificate_name}-certificate.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Certificate downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating certificate:", error)
      toast({
        title: "Error",
        description: `Failed to download certificate: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  const profileCompletion = calculateProfileCompletion(userDetails)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm flex justify-center items-center rounded-2xl text-white text-5xl font-bold border border-white/30">
                  {userDetails?.user_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{userDetails?.user_name || "User Profile"}</h1>
                  <p className="text-blue-100 text-lg mb-1">{userDetails?.designation || "Student"}</p>
                  {/* replaced TATTI with FrameFlow in certificate generation */}
                  <p className="text-blue-100">{userDetails?.current_organization || "FrameFlow Learning"}</p>
                </div>
              </div>
              <Button onClick={handleEditClick} className="bg-white text-blue-600 hover:bg-blue-50" size="lg">
                <Edit size={18} className="mr-2" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Profile Completion Card */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-700">Profile Completion</h3>
                      <span className="text-2xl font-bold text-blue-600">{profileCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                  {profileCompletion < 100 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-700">Complete your profile to unlock all features</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Links Card */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Connect With Me</h3>
                  <div className="flex flex-wrap gap-3">
                    {userDetails?.linkedin_profile && (
                      <a
                        href={userDetails.linkedin_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        aria-label="LinkedIn Profile"
                        title="LinkedIn"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}

                    {userDetails?.github_profile && (
                      <a
                        href={userDetails.github_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        aria-label="GitHub Profile"
                        title="GitHub"
                      >
                        <Github size={20} />
                      </a>
                    )}

                    {userDetails?.portfolio_website && (
                      <a
                        href={userDetails.portfolio_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        aria-label="Portfolio Website"
                        title="Portfolio"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Courses</span>
                      </div>
                      <span className="font-bold text-blue-600">{userCourses.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Certificates</span>
                      </div>
                      <span className="font-bold text-amber-600">{userCertificates.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Badges</span>
                      </div>
                      <span className="font-bold text-purple-600">{userBadges.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Experience</span>
                      </div>
                      <span className="font-bold text-green-600">{userDetails?.work_experience || 0}y</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border-0 shadow-sm p-1 rounded-lg">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  <User size={16} /> Profile
                </TabsTrigger>
                <TabsTrigger
                  value="courses"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  <BookOpen size={16} /> Courses
                </TabsTrigger>
                <TabsTrigger
                  value="certificates"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  <Award size={16} /> Certificates
                </TabsTrigger>
                <TabsTrigger
                  value="badges"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  <Star size={16} /> Badges
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8">
                    {isEditing ? (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                              <X size={16} className="mr-2" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                              <Save size={16} className="mr-2" /> Save Changes
                            </Button>
                          </div>
                        </div>

                        {/* Personal Information Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <User size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                            {[
                              { name: "user_name", label: "Full Name", icon: User },
                              { name: "age", label: "Age", icon: User, type: "number" },
                              { name: "mail_id", label: "Email", icon: Mail },
                              { name: "mobile_number", label: "Mobile", icon: Smartphone },
                              { name: "city", label: "City", icon: MapPin },
                            ].map((field) => (
                              <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-700">
                                  {field.label}
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <field.icon size={16} />
                                  </div>
                                  <Input
                                    type={field.type || "text"}
                                    id={field.name}
                                    name={field.name}
                                    value={editData?.[field.name as keyof UserDetails] || ""}
                                    onChange={handleInputChange}
                                    className={`pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors[field.name] ? "border-red-500" : ""}`}
                                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                                  />
                                </div>
                                {fieldErrors[field.name] && (
                                  <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {fieldErrors[field.name]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Professional Information Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                            {[
                              { name: "designation", label: "Designation", icon: Briefcase },
                              { name: "job_title", label: "Job Title", icon: Briefcase },
                              { name: "current_organization", label: "Organization", icon: Briefcase },
                              { name: "work_experience", label: "Experience (years)", icon: Briefcase, type: "number" },
                              { name: "highest_qualification", label: "Qualification", icon: GraduationCap },
                              { name: "year_of_passedout", label: "Graduation Year", icon: Calendar },
                              { name: "area_of_interest", label: "Areas of Interest", icon: Star },
                              { name: "ambition", label: "Career Ambition", icon: Target },
                            ].map((field) => (
                              <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-700">
                                  {field.label}
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <field.icon size={16} />
                                  </div>
                                  <Input
                                    type={field.type || "text"}
                                    id={field.name}
                                    name={field.name}
                                    value={editData?.[field.name as keyof UserDetails] || ""}
                                    onChange={handleInputChange}
                                    className={`pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors[field.name] ? "border-red-500" : ""}`}
                                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                                  />
                                </div>
                                {fieldErrors[field.name] && (
                                  <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {fieldErrors[field.name]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Globe size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Social & Portfolio Links</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                            {[
                              { name: "portfolio_website", label: "Portfolio Website", icon: Globe },
                              { name: "linkedin_profile", label: "LinkedIn Profile", icon: Linkedin },
                              { name: "github_profile", label: "GitHub Profile", icon: Github },
                            ].map((field) => (
                              <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-700">
                                  {field.label}
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <field.icon size={16} />
                                  </div>
                                  <Input
                                    type="url"
                                    id={field.name}
                                    name={field.name}
                                    value={editData?.[field.name as keyof UserDetails] || ""}
                                    onChange={handleInputChange}
                                    className={`pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors[field.name] ? "border-red-500" : ""}`}
                                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                                  />
                                </div>
                                {fieldErrors[field.name] && (
                                  <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {fieldErrors[field.name]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-900">Profile Details</h2>
                          <Button onClick={handleEditClick} className="bg-blue-600 hover:bg-blue-700">
                            <Edit size={16} className="mr-2" /> Edit Profile
                          </Button>
                        </div>

                        {/* Personal Information Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <User size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { icon: User, label: "Full Name", value: userDetails?.user_name },
                              { icon: User, label: "Age", value: userDetails?.age },
                              { icon: Mail, label: "Email", value: userDetails?.mail_id },
                              { icon: Smartphone, label: "Mobile", value: userDetails?.mobile_number },
                              { icon: MapPin, label: "City", value: userDetails?.city },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100 hover:shadow-md transition-shadow"
                              >
                                <div className="p-2 bg-white rounded-lg">
                                  <item.icon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                                  <p className="font-semibold text-gray-900">{item.value || "Not specified"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Professional Information Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { icon: Briefcase, label: "Designation", value: userDetails?.designation },
                              { icon: Briefcase, label: "Job Title", value: userDetails?.job_title },
                              { icon: Briefcase, label: "Organization", value: userDetails?.current_organization },
                              {
                                icon: Book,
                                label: "Work Experience",
                                value: `${userDetails?.work_experience || 0} years`,
                              },
                              {
                                icon: GraduationCap,
                                label: "Qualification",
                                value: userDetails?.highest_qualification,
                              },
                              { icon: Calendar, label: "Graduation Year", value: userDetails?.year_of_passedout },
                              { icon: Star, label: "Areas of Interest", value: userDetails?.area_of_interest },
                              { icon: Target, label: "Career Ambition", value: userDetails?.ambition },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100 hover:shadow-md transition-shadow"
                              >
                                <div className="p-2 bg-white rounded-lg">
                                  <item.icon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                                  <p className="font-semibold text-gray-900">{item.value || "Not specified"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Globe size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Social & Portfolio Links</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { icon: Globe, label: "Portfolio Website", value: userDetails?.portfolio_website },
                              { icon: Linkedin, label: "LinkedIn Profile", value: userDetails?.linkedin_profile },
                              { icon: Github, label: "GitHub Profile", value: userDetails?.github_profile },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100 hover:shadow-md transition-shadow"
                              >
                                <div className="p-2 bg-white rounded-lg">
                                  <item.icon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                                  <p className="font-semibold text-gray-900">
                                    {item.value ? (
                                      <a
                                        href={item.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all"
                                      >
                                        {item.value}
                                      </a>
                                    ) : (
                                      "Not specified"
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="courses">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {userCourses.length} courses
                      </span>
                    </div>

                    {userCourses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userCourses.map((course) => (
                          <Card
                            key={course.course_id}
                            className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                          >
                            <div className="h-40 bg-gradient-to-br from-blue-400 to-indigo-600 relative overflow-hidden">
                              <img
                                src={course.course_profile_image || "/placeholder.svg"}
                                alt={course.course_name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                                {course.course_progress}%
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900">{course.course_name}</h3>
                              <div className="h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
                                <div
                                  className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                                  style={{ width: `${course.course_progress}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 font-medium">
                                  {course.course_progress}% complete
                                </span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-600 hover:text-blue-700"
                                  asChild
                                >
                                  <a href={`/dashboard/courses/${course.course_id}/learn`}>Continue →</a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses enrolled</h3>
                        <p className="text-gray-600 mb-6">
                          You haven't enrolled in any courses yet. Start learning today!
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <a href="/dashboard/courses">Browse Courses</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certificates">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Your Certificates</h2>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                        {userCertificates.length} certificates
                      </span>
                    </div>

                    {userCertificates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userCertificates.map((cert, index) => (
                          <Card
                            key={`${cert.certificate_id}-${index}`}
                            className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                          >
                            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-bold mb-1">{cert.certificate_name}</h3>
                                  <p className="text-amber-100 text-sm font-medium">{cert.certification_level} Level</p>
                                </div>
                                <Award className="text-white w-8 h-8" />
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                                <Calendar className="w-4 h-4" />
                                <span>Issued on {new Date(cert.enrollment_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">ID: {cert.certificate_id}</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewCertificate(cert)}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Eye size={14} className="mr-1" /> View
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadCertificate(cert)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Download size={14} className="mr-1" /> Download
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates yet</h3>
                        <p className="text-gray-600 mb-6">
                          Complete courses to earn certificates and showcase your achievements
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <a href="/dashboard/courses">Browse Courses</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="badges">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Your Badges</h2>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {userBadges.length} badges
                      </span>
                    </div>

                    {userBadges.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {userBadges.map((badge) => {
                          const badgeColors = {
                            Skill: {
                              bg: "from-blue-50 to-cyan-50",
                              border: "border-blue-200",
                              text: "text-blue-700",
                              icon: <Star className="h-6 w-6 text-blue-600" />,
                            },
                            Achievement: {
                              bg: "from-amber-50 to-yellow-50",
                              border: "border-amber-200",
                              text: "text-amber-700",
                              icon: <Award className="h-6 w-6 text-amber-600" />,
                            },
                            Milestone: {
                              bg: "from-green-50 to-emerald-50",
                              border: "border-green-200",
                              text: "text-green-700",
                              icon: <Target className="h-6 w-6 text-green-600" />,
                            },
                          }

                          const badgeStyle = badgeColors[badge.badge_type as keyof typeof badgeColors] || {
                            bg: "from-gray-50 to-slate-50",
                            border: "border-gray-200",
                            text: "text-gray-700",
                            icon: <Star className="h-6 w-6 text-gray-600" />,
                          }

                          return (
                            <Card
                              key={badge.badge_id}
                              className={`bg-gradient-to-br ${badgeStyle.bg} border ${badgeStyle.border} shadow-md hover:shadow-lg transition-shadow`}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-3">
                                  {badgeStyle.icon}
                                  <div>
                                    <h3 className={`font-bold ${badgeStyle.text}`}>{badge.badge_name}</h3>
                                    <p className="text-sm text-gray-600">{badge.badge_level} Level</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm mt-4 pt-4 border-t border-gray-200">
                                  <Calendar className="w-4 h-4" />
                                  <span>Earned {new Date(badge.earned_date).toLocaleDateString()}</span>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No badges earned yet</h3>
                        <p className="text-gray-600 mb-6">Complete activities and milestones to earn badges</p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <a href="/dashboard/courses">Browse Courses</a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <Dialog open={isCertificateModalOpen} onOpenChange={setIsCertificateModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate of Completion</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="relative bg-white p-8 rounded-lg border-4 border-blue-500 shadow-xl">
              {/* Certificate Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-bold text-blue-600 mb-2">Companian</h1>
                  {/* replaced TATTI with FrameFlow in certificate generation */}
                  <p className="text-gray-600 text-lg">Powered by FrameFlow</p>
                </div>

                {/* Main Content */}
                <div className="text-center mb-8">
                  <p className="text-gray-700 mb-4 text-lg">This is to certify that</p>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">{userDetails?.user_name}</h2>
                  <p className="text-gray-700 mb-4 text-lg">has successfully completed the course</p>
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">{selectedCertificate.certificate_name}</h3>
                  <p className="text-gray-700 text-lg">Level: {selectedCertificate.certification_level}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end mt-16">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 w-48 pt-2">
                      <p className="text-sm text-gray-700 font-medium">Course Instructor</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 w-48 pt-2">
                      <p className="text-sm text-gray-700 font-medium">
                        Date: {new Date(selectedCertificate.enrollment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
