"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader } from "@/components/loader"
import { Check, X } from "lucide-react"

interface AssessmentQuestion {
    question_id: number
    question: string
    question_sequenceid: number
    course_id: number
}

interface AssessmentOption {
    option_sequence: number
    option_text: string
    question_id: number
    course_id: number
}

interface AssessmentProps {
    questions: AssessmentQuestion[]
    options: AssessmentOption[]
    courseId: string
    onComplete: () => void
}

type AnswerStatus = {
    [questionId: number]: {
        isCorrect: boolean
        isLoading: boolean
    }
}

export function Assessment({ questions, options, courseId, onComplete }: AssessmentProps) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>({})
    const { toast } = useToast()

    const handleOptionSelect = async (questionId: number, optionSequence: number) => {
        // Update selected answer immediately
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionSequence
        }))

        // Set loading state for this question
        setAnswerStatus(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], isLoading: true }
        }))

        const selectedOption = options.find(
            opt => opt.question_id === questionId &&
                opt.option_sequence === optionSequence
        )

        if (!selectedOption) return

        try {
            const response = await api.post("/check_answer", {
                question_id: questionId,
                option_text: selectedOption.option_text
            })

            const isCorrect = response.data.result === "Correct"

            setAnswerStatus(prev => ({
                ...prev,
                [questionId]: {
                    isCorrect,
                    isLoading: false
                }
            }))

            if (!isCorrect) {
                toast({
                    title: "Incorrect Answer",
                    description: "That's not the correct answer. Please try again.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error checking answer:", error)
            toast({
                title: "Error",
                description: "Failed to check answer",
                variant: "destructive",
            })
            setAnswerStatus(prev => ({
                ...prev,
                [questionId]: { ...prev[questionId], isLoading: false }
            }))
        }
    }

    const handleSubmit = async () => {
        // Check if all questions have been answered
        if (Object.keys(selectedAnswers).length !== questions.length) {
            toast({
                title: "Incomplete Assessment",
                description: "Please answer all questions before submitting.",
                variant: "destructive",
            })
            return
        }

        // Check if any answers are still being verified
        const isChecking = Object.values(answerStatus).some(status => status?.isLoading)
        if (isChecking) {
            toast({
                title: "Verification In Progress",
                description: "Please wait while we verify your answers.",
                variant: "destructive",
            })
            return
        }

        // Check if all answers are correct
        // const allCorrect = questions.every(q => answerStatus[q.question_id]?.isCorrect)
        // if (!allCorrect) {
        //     toast({
        //         title: "Incorrect Answers",
        //         description: "Some answers are incorrect. Please correct them before submitting.",
        //         variant: "destructive",
        //     })
        //     return
        // }

        setIsSubmitting(true)
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}")

            const response = await api.post("/submit-assessment", {
                user_id: user.user_id,
                course_id: courseId,
                answers: selectedAnswers
            })

            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Assessment submitted successfully!",
                })
                onComplete()
            } else {
                toast({
                    title: "Error",
                    description: response.data.message || "Failed to submit assessment",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error submitting assessment:", error)
            toast({
                title: "Error",
                description: "Failed to submit assessment",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getOptionsForQuestion = (questionId: number) => {
        return options.filter(option => option.question_id === questionId)
    }

    return (
        <div className="mt-6 overflow-auto h-[calc(100vh-120px)] pb-5 pr-4">
            <h2 className="text-2xl font-bold mb-6 text-primary">Practice Assessment</h2>

            <div className="space-y-6">
                {questions.sort((a, b) => a.question_sequenceid - b.question_sequenceid).map((question) => {
                    const status = answerStatus[question.question_id]
                    const isCorrect = status?.isCorrect
                    const isLoading = status?.isLoading

                    return (
                        <Card key={question.question_id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {question.question_sequenceid}. {question.question}
                                    </h3>
                                    {status && !isLoading && (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCorrect ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-1" /> Correct
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-4 w-4 mr-1" /> Incorrect
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {getOptionsForQuestion(question.question_id).map((option) => {
                                        const isSelected = selectedAnswers[question.question_id] === option.option_sequence
                                        const showAsIncorrect = isSelected && status && !isLoading && !isCorrect

                                        return (
                                            <div
                                                key={`${question.question_id}-${option.option_sequence}`}
                                                className={`p-3 rounded-md cursor-pointer transition-colors border ${isSelected
                                                    ? showAsIncorrect
                                                        ? 'bg-red-50 border-red-500'
                                                        : 'bg-primary/10 border-primary'
                                                    : 'hover:bg-gray-100 border-gray-200'
                                                    }`}
                                                onClick={() => !isLoading && handleOptionSelect(question.question_id, option.option_sequence)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    {option.option_text}
                                                    {isLoading && isSelected ? (
                                                        <Loader className="h-4 w-4 ml-2 animate-spin" />
                                                    ) : (
                                                        <>
                                                            {isSelected && isCorrect && <Check className="h-4 w-4 ml-2 text-green-500" />}
                                                            {showAsIncorrect && <X className="h-4 w-4 ml-2 text-red-500" />}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="mt-8 flex justify-between items-center">
                <div>
                    {Object.keys(answerStatus).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            Correct answers: {Object.values(answerStatus).filter(s => s?.isCorrect).length} / {questions.length}
                        </div>
                    )}
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || Object.keys(selectedAnswers).length !== questions.length}
                    className="px-8 py-4"
                >
                    {isSubmitting ? <Loader className="mr-2" /> : null}
                    Submit Assessment
                </Button>
            </div>
        </div>
    )
}
