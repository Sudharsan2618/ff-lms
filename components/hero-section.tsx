import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                ✨ Learn at Your Own Pace
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
              Master New Skills with Expert-Led Courses
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access thousands of courses from industry experts. Learn programming, design, business, and more. Start
              your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Explore Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 md:h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-2xl p-8 h-full flex flex-col justify-center items-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <p className="text-center text-muted-foreground">Join 500K+ learners worldwide</p>
              <div className="flex gap-2 pt-4">
                <div className="w-8 h-8 bg-primary rounded-full" />
                <div className="w-8 h-8 bg-accent rounded-full" />
                <div className="w-8 h-8 bg-primary/50 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
