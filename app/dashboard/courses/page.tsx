"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, CheckCircle, Filter, Search, X } from "lucide-react"
import { api } from "@/lib/api"
import { CourseCard } from "@/components/course-card"

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
  course_status: string
  validity?: number;
  updated_date?: string;
  remaining_days?: number;
  remaining_hours?: number;
  remaining_minutes?: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("All Courses")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;

        if (!userId) {
          console.error("User ID not found in localStorage.");
          setCoursesError("User not logged in.");
          setLoading(false);
          return;
        }

        const response = await api.get(`/user-courses?user_id=${userId}`)
        setCourses(response.data.courses || [])
        setFilteredCourses(response.data.courses || [])
      } catch (error: any) {
        console.error("Error fetching courses:", error)
        setCoursesError("Failed to fetch courses.")
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    if (statusFilter !== "All Courses") {
      filtered = filtered.filter((course) => course.course_status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (typeFilter !== "All Types") {
      filtered = filtered.filter((course) => course.course_type.toLowerCase() === typeFilter.toLowerCase())
    }

    if (searchTerm) {
      filtered = filtered.filter((course) => course.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredCourses(filtered)
  }, [statusFilter, typeFilter, searchTerm, courses])

  const clearFilters = () => {
    setStatusFilter("All Courses")
    setTypeFilter("All Types")
    setSearchTerm("")
  }

  const totalCourses = courses.length
  const activeCourses = courses.filter((course) => course.course_status === "active").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Explore Courses</h1>
              <p className="text-gray-500 mt-1">Discover new skills and advance your career</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <BookOpen size={16} />
                <span className="font-medium">{loading ? "..." : totalCourses} Courses</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                <CheckCircle size={16} />
                <span className="font-medium">{loading ? "..." : activeCourses} Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="pl-10 pr-4 py-3 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                variant="outline"
                className="flex items-center gap-2 md:w-auto w-full justify-center"
              >
                <Filter size={18} />
                <span>Filters</span>
              </Button>

              {(statusFilter !== "All Courses" || typeFilter !== "All Types") && (
                <Button
                  onClick={clearFilters}
                  variant="destructive"
                  className="flex items-center gap-2 md:w-auto w-full justify-center"
                >
                  <X size={18} />
                  <span>Clear Filters</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {isFilterOpen && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-in slide-in-from-top">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Courses">All Courses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Types">All Types</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="subscribe">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="h-[320px] bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <Button onClick={clearFilters} className="mt-4">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
