import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, BookOpen, TrendingUp } from "lucide-react"

const stats = [
  {
    icon: BookOpen,
    label: "Courses Enrolled",
    value: "12",
    color: "text-blue-500",
  },
  {
    icon: CheckCircle2,
    label: "Completed",
    value: "5",
    color: "text-green-500",
  },
  {
    icon: TrendingUp,
    label: "Learning Streak",
    value: "23 days",
    color: "text-orange-500",
  },
]

const inProgress = [
  {
    id: 1,
    title: "React Fundamentals",
    progress: 65,
    instructor: "Sarah Chen",
  },
  {
    id: 2,
    title: "Advanced TypeScript",
    progress: 42,
    instructor: "John Smith",
  },
  {
    id: 3,
    title: "UI/UX Design Principles",
    progress: 88,
    instructor: "Emma Wilson",
  },
]

export default function LearningDashboard() {
  return (
    <section className="py-20 md:py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Your Learning Dashboard</h2>
          <p className="text-lg text-muted-foreground">Track your progress and continue where you left off</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* In Progress Courses */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Your courses in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {inProgress.map((course) => (
              <div key={course.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">{course.instructor}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{course.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  )
}
