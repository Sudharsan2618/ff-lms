"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader } from "@/components/loader"
import questionImage from "@/assets/images/question.png"
import Image from "next/image"

interface Question {
  question_id: number
  question: string
  options: Array<{
    option_id: number
    option_text: string
  }>
  selected_option?: {
    selected_option_id: number
  }
}

export default function QuestionsPage() {
  const [expandedQuestion, setExpandedQuestion] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, { option_id: number }>>({})
  const [activeTab, setActiveTab] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [tabName, setTabName] = useState("")
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [allSuccess, setAllSuccess] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Check if user has already completed questions
  useEffect(() => {
    const hasCompletedQuestions = JSON.parse(localStorage.getItem("hasCompletedQuestions") || "false")
    if (hasCompletedQuestions) {
      router.push("/dashboard")
    }
  }, [router])

  // Fetch questions for the current tab
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const user = JSON.parse(localStorage.getItem("user") || "{}")

        if (!user.user_id) {
          router.push("/login")
          return
        }

        const response = await api.post("/initial_assessment_questions", {
          tab_id: activeTab,
          user_id: user.user_id,
        })

        setQuestions(response.data.questions || [])
        setTabName(response.data.tab_name || "")
      } catch (error) {
        console.error("Error fetching questions:", error)
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [activeTab, router, toast])

  // Handle option selection
  const handleOptionChange = async (questionId: number, option: { option_id: number }) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: option,
    }))

    setErrors((prev) => ({
      ...prev,
      [questionId]: null,
      tab: null,
    }))

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      await api.post("/initial_assessment_response", {
        user_id: user.user_id,
        question_id: questionId,
        selected_option_id: option.option_id,
        tab_id: activeTab,
      })
    } catch (error) {
      console.error("Error saving response:", error)
    }
  }

  // Validate if all questions in the current tab are answered
  const validateTab = () => {
    return questions.every(
      (question) => selectedOptions[question.question_id] || question.selected_option?.selected_option_id,
    )
  }

  // Handle next button click
  const handleNext = async () => {
    setExpandedQuestion(1)
    if (validateTab()) {
      if (activeTab === 5) {
        try {
          setLoading(true)
          const user = JSON.parse(localStorage.getItem("user") || "{}")
          await api.post("/user-initial-assessment-details", {
            user_id: user.user_id,
          })

          localStorage.setItem("hasCompletedQuestions", "true")
          setAllSuccess(true)

          toast({
            title: "Assessment Completed",
            description: "Thank you for completing the assessment!",
          })

          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } catch (error) {
          console.error("Error completing assessment:", error)
          toast({
            title: "Error",
            description: "Failed to complete assessment. Please try again.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      } else {
        setActiveTab((prev) => prev + 1)
      }

      setErrors((prev) => ({
        ...prev,
        tab: null,
      }))
    } else {
      setErrors((prev) => ({
        ...prev,
        tab: "Please answer all questions in this tab before proceeding.",
      }))
    }
  }

  // Handle previous button click
  const handlePrevious = () => {
    setActiveTab((prev) => (prev > 1 ? prev - 1 : 1))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold border-b-2 border-primary">{tabName}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {questions.map((question, i) => (
              <Card key={question.question_id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedQuestion(i + 1)}
                  className={`w-full p-4 text-left rounded flex justify-between items-center ${expandedQuestion === i + 1 ? "bg-primary/10" : "bg-white"
                    }`}
                >
                  <span className="text-lg font-medium">{question.question}</span>
                  {expandedQuestion === i + 1 ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedQuestion === i + 1 && question.options && (
                  <CardContent className="pt-4">
                    <RadioGroup
                      value={
                        selectedOptions[question.question_id]?.option_id?.toString() ||
                        question.selected_option?.selected_option_id?.toString() ||
                        ""
                      }
                      onValueChange={(value) =>
                        handleOptionChange(question.question_id, { option_id: Number.parseInt(value) })
                      }
                    >
                      {question.options.map((option) => (
                        <div key={option.option_id} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem
                            value={option.option_id.toString()}
                            id={`option-${question.question_id}-${option.option_id}`}
                          />
                          <Label
                            htmlFor={`option-${question.question_id}-${option.option_id}`}
                            className="cursor-pointer"
                          >
                            {option.option_text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {/* <img src="/placeholder.svg" alt="Assessment" className="w-48 h-48 object-contain" /> */}
              <Image src={questionImage} alt="Assessment" className="w-48 h-48 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Help us understand more about you!</h2>
            <p className="text-gray-600">Your answers will help us personalize your learning experience.</p>
          </div>
        </div>

        {errors.tab && <div className="mt-4 text-red-500 text-sm">{errors.tab}</div>}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeTab === 1 || loading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          <Button onClick={handleNext} disabled={!validateTab() || loading} className="flex items-center gap-2">
            {activeTab === 5 ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
