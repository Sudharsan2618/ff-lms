import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Users, Clock } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "React Fundamentals",
    description: "Learn the basics of React and build interactive UIs",
    instructor: "Sarah Chen",
    rating: 4.8,
    students: 12500,
    duration: "8 weeks",
    level: "Beginner",
    image: "bg-blue-500/20",
  },
  {
    id: 2,
    title: "Advanced TypeScript",
    description: "Master TypeScript for scalable applications",
    instructor: "John Smith",
    rating: 4.9,
    students: 8300,
    duration: "6 weeks",
    level: "Advanced",
    image: "bg-purple-500/20",
  },
  {
    id: 3,
    title: "UI/UX Design Principles",
    description: "Create beautiful and user-friendly interfaces",
    instructor: "Emma Wilson",
    rating: 4.7,
    students: 15200,
    duration: "10 weeks",
    level: "Intermediate",
    image: "bg-pink-500/20",
  },
  {
    id: 4,
    title: "Web Performance Optimization",
    description: "Optimize your web applications for speed",
    instructor: "Mike Johnson",
    rating: 4.8,
    students: 6800,
    duration: "5 weeks",
    level: "Advanced",
    image: "bg-green-500/20",
  },
]

export default function FeaturedCourses() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Featured Courses</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked courses from industry experts to help you advance your career
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div
                  className={`w-full h-32 ${course.image} rounded-lg mb-4 group-hover:scale-105 transition-transform`}
                />
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="text-sm">{course.instructor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{course.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{(course.students / 1000).toFixed(1)}K</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                  <span className="ml-auto px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {course.level}
                  </span>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Enroll Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
