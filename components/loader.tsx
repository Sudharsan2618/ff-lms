import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "default" | "lg"
  className?: string
}

export function Loader({ size = "default", className }: LoaderProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn("animate-spin rounded-full border-t-2 border-primary", {
          "h-4 w-4 border": size === "sm",
          "h-8 w-8 border-2": size === "default",
          "h-12 w-12 border-4": size === "lg",
        })}
      />
    </div>
  )
}
