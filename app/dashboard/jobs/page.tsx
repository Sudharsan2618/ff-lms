"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Job {
  job_id: number
  job_title: string
  company: string
  location: string
  salary: string
  apply_link: string
  updated_date: string
  description: string
  job_type: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // useEffect(() => {
  //   const fetchJobs = async () => {
  //     try {
  //       setLoading(true)
  //       const user = JSON.parse(localStorage.getItem("user") || "{}")
  //       const response = await api.get(`/jobs/${user.user_id}`)
  //       setRecommendedJobs(response.data.recommended_jobs || [])
  //       setJobs(response.data.all_jobs || [])
  //       setFilteredJobs(response.data.all_jobs || [])
  //     } catch (error) {
  //       console.error("Error fetching jobs:", error)
  //       toast({
  //         title: "Error",
  //         description: "Failed to load jobs",
  //         variant: "destructive",
  //       })
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //
  //   fetchJobs()
  // }, [toast])

  useEffect(() => {
    let results = jobs.filter(
      (job) =>
        job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    if (jobTypeFilter !== "all") {
      results = results.filter((job) => job.job_type.toLowerCase() === jobTypeFilter.toLowerCase())
    }

    setFilteredJobs(results)
  }, [searchQuery, jobTypeFilter, jobs])

  // Get unique job types for the dropdown
  const jobTypes = ["all", ...new Set(jobs.map((job) => job?.job_type?.toLowerCase()))]

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-100">
      <div className="bg-primary shadow-md border-b text-white py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Job Listings</h1>
            <p className="text-primary-200 mt-1">Find the latest job opportunities</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 text-black focus:ring-primary"
            />
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-white text-black">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type?.charAt(0)?.toUpperCase() + type?.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Search size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Jobs Coming Soon</h3>
          <p className="text-gray-500">Job listings will be available soon. Stay tuned!</p>
        </div>
      </div>
    </div>
  )
}
