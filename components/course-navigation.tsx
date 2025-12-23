"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface CourseContentItem {
  course_mastertitle_breakdown_id: number
  course_mastertitle_breakdown: string
  course_subtitle_id: number
  course_subtitle: string
  subtitle_content: string
}

interface CourseProgress {
  course_subtitle_id: number
  course_subtitle_progress: number
}

interface CourseNavigationProps {
  courseContent: CourseContentItem[]
  courseProgress: CourseProgress[]
  courseStatus: any
  onContentSelect: (id: string) => void
  setIsSidebarOpen: (open: boolean) => void
  activeContentId: string
}

export function CourseNavigation({
  courseContent,
  courseProgress,
  courseStatus,
  onContentSelect,
  setIsSidebarOpen,
  activeContentId,
}: CourseNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const courseStructure = courseContent.reduce(
    (acc, item) => {
      const { course_mastertitle_breakdown_id, course_mastertitle_breakdown, course_subtitle_id, course_subtitle } =
        item
      const uniqueSubtitleId = `${course_mastertitle_breakdown_id}-${course_subtitle_id}`

      if (!acc[course_mastertitle_breakdown_id]) {
        acc[course_mastertitle_breakdown_id] = {
          id: course_mastertitle_breakdown_id,
          title: course_mastertitle_breakdown,
          subtitles: [],
        }
      }

      acc[course_mastertitle_breakdown_id].subtitles.push({
        id: uniqueSubtitleId,
        title: course_subtitle,
        subtitleId: course_subtitle_id,
      })

      return acc
    },
    {} as Record<
      number,
      { id: number; title: string; subtitles: Array<{ id: string; title: string; subtitleId: number }> }
    >,
  )

  const progressMap =
    courseProgress?.reduce(
      (acc, { course_subtitle_id, course_subtitle_progress }) => {
        acc[course_subtitle_id] = course_subtitle_progress
        return acc
      },
      {} as Record<number, number>,
    ) || {}

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Calculate overall course progress
  const overallProgress = courseStatus?.data?.length > 0
    ? courseStatus.data.reduce((sum: number, s: any) => sum + s.progress_percentage, 0) /
      courseStatus.data.length
    : 0;

  return (
    <nav className="p-4 bg-white h-full">
      <h2 className="text-xl font-bold mb-4 text-primary">Course Contents</h2>
      <ul className="space-y-4">
        {Object.values(courseStructure).map(({ id, title, subtitles }) => {
          const sectionStatus = courseStatus?.data?.find((s: any) => s.course_master_breakdown_id === id)
          const sectionProgress = sectionStatus?.progress_percentage || 0

          return (
            <li key={id} className="border-b pb-2 last:border-none">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleSection(id)}
                  className="flex items-center justify-between w-full text-left font-medium px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {expandedSections.has(id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    {title}
                  </span>
                  <div className="w-12 text-xs text-center font-medium">{Math.round(sectionProgress)}%</div>
                </button>

                <Progress value={sectionProgress} className="h-1.5 w-full" />

                {expandedSections.has(id) && (
                  <ul className="ml-6 mt-2 space-y-1">
                    {subtitles.map(({ id: subId, title: subTitle, subtitleId }) => {
                      const progress = progressMap[subtitleId] || 0
                      const isActive = subId === activeContentId

                      return (
                        <li key={subId} className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              onContentSelect(subId)
                              setIsSidebarOpen(false)
                            }}
                            className={`text-sm flex-1 text-left px-3 py-2 rounded transition-all ${isActive ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-100"
                              }`}
                          >
                            {subTitle}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
        <li className="border-b pb-2 last:border-none">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onContentSelect("assessment")
                setIsSidebarOpen(false)
              }}
              className={`text-sm flex-1 text-left px-4 py-2 rounded transition-all ${activeContentId === "assessment" ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              Practice Assessment
            </button>
          </div>
        </li>
      </ul>
    </nav>
  )
}
