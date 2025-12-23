"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ZoomIn, ZoomOut, Eye, Settings, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

// Load pdfjs-dist from CDN to avoid Next.js webpack bundling issues
let pdfjsLib: any = null
let pdfjsInitialized = false
const PDFJS_VERSION = "3.11.174" // Stable version that works well with CDN

async function loadPdfjsFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"))
      return
    }

    const win = window as any

    const checkForPdfjs = () => {
      // PDF.js CDN exposes it in different ways depending on the build
      // Check all possible global variable names
      return (
        win.pdfjsLib?.getDocument ||
        win.pdfjs?.getDocument ||
        win.pdfjsLib ||
        win.pdfjs ||
        win.PDFJS?.getDocument ||
        win.pdfjsDist?.getDocument ||
        (typeof win.pdfjsLib !== "undefined" && win.pdfjsLib !== null) ||
        (typeof win.pdfjs !== "undefined" && win.pdfjs !== null)
      )
    }

    const getPdfjsFromWindow = () => {
      // Try different possible global names
      if (win.pdfjsLib && win.pdfjsLib.getDocument) return win.pdfjsLib
      if (win.pdfjs && win.pdfjs.getDocument) return win.pdfjs
      if (win.PDFJS && win.PDFJS.getDocument) return win.PDFJS
      if (win.pdfjsDist && win.pdfjsDist.getDocument) return win.pdfjsDist
      // Fallback - check if it exists even without getDocument
      if (win.pdfjsLib) return win.pdfjsLib
      if (win.pdfjs) return win.pdfjs
      return null
    }

    // Check if already loaded
    if (checkForPdfjs()) {
      const lib = getPdfjsFromWindow()
      if (lib && typeof lib.getDocument === "function") {
        // Set up worker if not already set
        if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
          lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
        }
        pdfjsLib = lib
        pdfjsInitialized = true
        resolve(lib)
        return
      }
    }

    // Check if script is already loading
    const existingScript = document.querySelector(`script[src*="pdf.js"]`) as HTMLScriptElement
    if (existingScript) {
      // Wait for it to load
      let attempts = 0
      const maxAttempts = 100 // 10 seconds max wait
      const checkInterval = setInterval(() => {
        attempts++
        if (checkForPdfjs()) {
          clearInterval(checkInterval)
          const pdfLib = getPdfjsFromWindow()
          if (pdfLib && typeof pdfLib.getDocument === "function") {
            if (pdfLib.GlobalWorkerOptions && !pdfLib.GlobalWorkerOptions.workerSrc) {
              pdfLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`
            }
            pdfjsLib = pdfLib
            pdfjsInitialized = true
            resolve(pdfLib)
          } else {
            clearInterval(checkInterval)
            reject(new Error("PDF.js loaded but getDocument method not found"))
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          reject(new Error("Timeout waiting for PDF.js to load after 10 seconds"))
        }
      }, 100)
      return
    }

    // Load pdf.js from CDN (using unpkg which has better UMD builds)
    const script = document.createElement("script")
    // Try unpkg first, fallback to cdnjs
    script.src = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`
    script.async = true

    script.onload = () => {
      // Wait a bit for PDF.js to initialize - increase wait time
      let attempts = 0
      const maxAttempts = 50 // 5 seconds
      const checkInterval = setInterval(() => {
        attempts++
        if (checkForPdfjs()) {
          clearInterval(checkInterval)
          const pdfLib = getPdfjsFromWindow()
          if (pdfLib && typeof pdfLib.getDocument === "function") {
            // Set up worker
            if (pdfLib.GlobalWorkerOptions) {
              pdfLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`
            }
            pdfjsLib = pdfLib
            pdfjsInitialized = true
            resolve(pdfLib)
          } else {
            reject(
              new Error(
                "PDF.js loaded but getDocument method is not a function. Library: " +
                  JSON.stringify(Object.keys(pdfLib || {})),
              ),
            )
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          // Try to debug what's available
          const debugInfo = {
            pdfjsLib: typeof win.pdfjsLib,
            pdfjs: typeof win.pdfjs,
            PDFJS: typeof win.PDFJS,
            allKeys: Object.keys(win).filter((k) => k.toLowerCase().includes("pdf")),
          }
          reject(
            new Error(
              `PDF.js script loaded but library not found on window after ${maxAttempts * 100}ms. Debug: ${JSON.stringify(debugInfo)}`,
            ),
          )
        }
      }, 100)
    }

    script.onerror = () => {
      // Try fallback CDN (cdnjs)
      const fallbackScript = document.createElement("script")
      fallbackScript.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
      fallbackScript.async = true

      // Use same onload handler
      fallbackScript.onload = () => {
        let attempts = 0
        const maxAttempts = 50
        const checkInterval = setInterval(() => {
          attempts++
          if (checkForPdfjs()) {
            clearInterval(checkInterval)
            const pdfLib = getPdfjsFromWindow()
            if (pdfLib && typeof pdfLib.getDocument === "function") {
              if (pdfLib.GlobalWorkerOptions) {
                pdfLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`
              }
              pdfjsLib = pdfLib
              pdfjsInitialized = true
              resolve(pdfLib)
            } else {
              reject(new Error("PDF.js loaded from fallback CDN but getDocument method not found"))
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval)
            reject(new Error("Timeout loading PDF.js from fallback CDN"))
          }
        }, 100)
      }

      fallbackScript.onerror = () => {
        reject(new Error("Failed to load PDF.js from both CDNs (unpkg and cdnjs)"))
      }
      document.head.appendChild(fallbackScript)
    }

    document.head.appendChild(script)
  })
}

async function getPdfjsLib() {
  if (typeof window === "undefined") return null

  if (!pdfjsInitialized) {
    try {
      pdfjsLib = await loadPdfjsFromCDN()
    } catch (error) {
      console.error("Failed to load pdfjs-dist:", error)
      return null
    }
  }
  return pdfjsLib
}

interface SecurePdfViewerProps {
  pdfUrl: string
}

// Convert Google Drive URL to direct download URL
function convertGoogleDriveUrl(url: string): string {
  // If it's already a direct link or not Google Drive, return as is
  if (!url.includes("drive.google.com")) {
    return url
  }

  // Extract file ID from Google Drive URL (multiple possible formats)
  // Format 1: /file/d/FILE_ID/view
  // Format 2: /file/d/FILE_ID/
  // Format 3: file/d/FILE_ID
  const fileIdMatch = url.match(/[/]file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1]
    // Try direct download URL (works for publicly accessible files)
    // For view-only files, this might need to be a different URL
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }

  return url
}

export function SecurePdfViewer({ pdfUrl }: SecurePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(150)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderedPages = useRef<Set<string>>(new Set()) // Store as "pageNum-zoom" strings
  const renderTasks = useRef<Map<number, any>>(new Map()) // Track render tasks to cancel them
  const renderingPages = useRef<Set<number>>(new Set()) // Track pages currently being rendered

  // Convert Google Drive URL to direct download URL
  const directPdfUrl = convertGoogleDriveUrl(pdfUrl)

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true)
        setError(null)

        // Dynamically load pdfjs-dist
        const pdfjs = await getPdfjsLib()
        if (!pdfjs || !pdfjs.getDocument) {
          throw new Error("Failed to load PDF.js library")
        }

        const loadingTask = pdfjs.getDocument({
          url: directPdfUrl,
          withCredentials: false,
          // CORS mode for cross-origin requests
          isEvalSupported: false,
          useSystemFonts: false,
        })

        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch (err: any) {
        console.error("Error loading PDF:", err)
        let errorMessage = "Failed to load PDF."

        // Check for CORS or network errors
        if (err.name === "UnexpectedResponseException" || err.message?.includes("CORS")) {
          errorMessage =
            "CORS error: The PDF server doesn't allow cross-origin requests. If using Google Drive, ensure the file is publicly accessible or use a direct PDF URL."
        } else if (err.name === "InvalidPDFException") {
          errorMessage = "Invalid PDF file or the URL doesn't point to a valid PDF document."
        } else if (err.message) {
          errorMessage = err.message
        }

        setError(errorMessage)
        setLoading(false)
      }
    }

    loadPdf()
  }, [directPdfUrl])

  // Render a single page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) {
        return
      }

      // If already rendered with current zoom, skip
      const pageKey = `${pageNum}-${zoom}`
      if (renderedPages.current.has(pageKey)) {
        return
      }

      // If already rendering this page, skip to avoid duplicates
      if (renderingPages.current.has(pageNum)) {
        return
      }

      // Cancel any existing render task for this page
      const existingTask = renderTasks.current.get(pageNum)
      if (existingTask) {
        try {
          existingTask.cancel()
        } catch (e) {
          // Ignore cancel errors
        }
        renderTasks.current.delete(pageNum)
      }

      try {
        renderingPages.current.add(pageNum)

        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: zoom / 100 })

        // Get or create canvas for this page
        let canvas = pageRefs.current.get(pageNum)
        if (!canvas) {
          canvas = document.createElement("canvas")
          canvas.className = "pdf-page-canvas mb-6 shadow-xl mx-auto rounded-lg border border-gray-300"
          canvas.style.display = "block"
          canvas.style.userSelect = "none"
          canvas.style.webkitUserSelect = "none"
          canvas.style.pointerEvents = "none"

          // Add watermark overlay to canvas
          canvas.addEventListener("contextmenu", (e) => e.preventDefault())
          canvas.addEventListener("dragstart", (e) => e.preventDefault())

          pageRefs.current.set(pageNum, canvas)

          if (canvasContainerRef.current) {
            canvasContainerRef.current.appendChild(canvas)
          }
        }

        const context = canvas.getContext("2d", {
          willReadFrequently: false,
        })

        // Resize canvas
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        // Start render task and track it
        const renderTask = page.render(renderContext)
        renderTasks.current.set(pageNum, renderTask)

        // Wait for render to complete
        await renderTask.promise

        // Only mark as rendered if the task completed successfully
        renderedPages.current.add(pageKey)
      } catch (err: any) {
        // If cancelled, don't log as error
        if (err.name !== "RenderingCancelledException" && err.name !== "AbortException") {
          console.error(`Error rendering page ${pageNum}:`, err)
        }
      } finally {
        renderingPages.current.delete(pageNum)
        renderTasks.current.delete(pageNum)
      }
    },
    [pdfDoc, zoom],
  )

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || pageRefs.current.size === 0) return

    // Render first few pages immediately
    const initialPages = Math.min(3, numPages)
    for (let i = 1; i <= initialPages; i++) {
      renderPage(i)
    }

    // Intersection Observer for lazy loading remaining pages
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const canvas = entry.target as HTMLCanvasElement
            const pageNum = Number.parseInt(canvas.dataset.pageNum || "1", 10)
            const pageKey = `${pageNum}-${zoom}`
            if (!renderedPages.current.has(pageKey) && !renderingPages.current.has(pageNum)) {
              renderPage(pageNum)
            }
          }
        })
      },
      {
        rootMargin: "300px", // Start loading 300px before page comes into view
        threshold: 0.01,
      },
    )

    // Observe all canvas elements
    const canvases = Array.from(pageRefs.current.values())
    canvases.forEach((canvas) => {
      observer.observe(canvas)
    })

    return () => {
      observer.disconnect()
    }
  }, [pdfDoc, numPages, renderPage])

  // Re-render all pages when zoom changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return

    // Cancel all ongoing render tasks
    renderTasks.current.forEach((task) => {
      try {
        task.cancel()
      } catch (e) {
        // Ignore cancel errors
      }
    })
    renderTasks.current.clear()

    // Clear rendered pages cache to force re-render with new zoom
    renderedPages.current.clear()
    renderingPages.current.clear()

    // Small delay to ensure previous renders are cancelled
    setTimeout(() => {
      // Re-render all visible pages with new zoom
      const canvases = Array.from(pageRefs.current.values())
      canvases.forEach((canvas) => {
        const pageNum = Number.parseInt(canvas.dataset.pageNum || "1", 10)
        renderPage(pageNum)
      })
    }, 50)
  }, [zoom, renderPage, pdfDoc, numPages])

  // Security measures
  useEffect(() => {
    const preventSelection = (e: Event) => {
      e.preventDefault()
      return false
    }

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const preventKeydown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, PrintScreen, F12, etc.
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" ||
          e.key === "a" ||
          e.key === "p" ||
          e.key === "s" ||
          e.key === "u" ||
          e.key === "i" ||
          e.key === "j")
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Block PrintScreen, F12 (DevTools), etc.
      if (e.key === "PrintScreen" || e.key === "F12" || (e.shiftKey && e.key === "F12")) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.clipboardData?.setData("text/plain", "")
      return false
    }

    const preventCut = (e: ClipboardEvent) => {
      e.preventDefault()
      return false
    }

    const preventPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      return false
    }

    const preventPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const preventDrag = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Block right-click, DevTools shortcuts, etc.
    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("selectstart", preventSelection)
    document.addEventListener("copy", preventCopy)
    document.addEventListener("cut", preventCut)
    document.addEventListener("paste", preventPaste)
    document.addEventListener("keydown", preventKeydown)
    document.addEventListener("keydown", preventPrint)
    document.addEventListener("dragstart", preventDrag)

    // Block print via beforeprint event
    window.addEventListener("beforeprint", (e) => {
      e.preventDefault()
      return false
    })

    // Disable text selection globally on the container
    if (containerRef.current) {
      containerRef.current.style.userSelect = "none"
      ;(containerRef.current.style as any).WebkitUserSelect = "none"
      ;(containerRef.current.style as any).MozUserSelect = "none"
      ;(containerRef.current.style as any).msUserSelect = "none"

      // Add overlay to prevent screenshots (CSS-based, limited effectiveness)
      containerRef.current.style.pointerEvents = "auto"
    }

    // CSS to prevent screenshot overlays (limited browser support)
    const style = document.createElement("style")
    style.textContent = `
      .secure-pdf-container {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .pdf-page-canvas {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("selectstart", preventSelection)
      document.removeEventListener("copy", preventCopy)
      document.removeEventListener("cut", preventCut)
      document.removeEventListener("paste", preventPaste)
      document.removeEventListener("keydown", preventKeydown)
      document.removeEventListener("keydown", preventPrint)
      document.removeEventListener("dragstart", preventDrag)
      window.removeEventListener("beforeprint", preventPrint as any)
      document.head.removeChild(style)
    }
  }, [])

  // Create canvas elements for all pages (for lazy loading)
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || !canvasContainerRef.current) return

    // Clear existing canvases and refs
    canvasContainerRef.current.innerHTML = ""
    pageRefs.current.clear()
    renderedPages.current.clear()

    // Create canvas elements for all pages (placeholders)
    for (let i = 1; i <= numPages; i++) {
      const canvas = document.createElement("canvas")
      canvas.className = "pdf-page-canvas mb-6 shadow-xl mx-auto rounded-lg border border-gray-300"
      canvas.style.display = "block"
      canvas.style.userSelect = "none"
      canvas.style.webkitUserSelect = "none"
      canvas.style.pointerEvents = "none"
      canvas.dataset.pageNum = i.toString()
      canvas.setAttribute("data-page", i.toString())

      // Add event listeners for security
      canvas.addEventListener("contextmenu", (e) => e.preventDefault())
      canvas.addEventListener("dragstart", (e) => e.preventDefault())

      canvasContainerRef.current.appendChild(canvas)
      pageRefs.current.set(i, canvas)
    }
  }, [pdfDoc, numPages])

  const handleZoom = (direction: "in" | "out") => {
    const newZoom = direction === "in" ? Math.min(zoom + 10, 200) : Math.max(zoom - 10, 50)
    setZoom(newZoom)
  }

  const scrollToPage = (pageNum: number) => {
    const canvas = pageRefs.current.get(pageNum)
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" })
      setCurrentPage(pageNum)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-white secure-pdf-container"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      {/* Settings Icon in Corner */}
      <div className="absolute top-4 right-4 z-20" ref={settingsRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className={`h-11 w-11 bg-white shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200 rounded-full transition-all duration-200 ${
            showSettings ? "ring-2 ring-orange-500 ring-offset-2" : ""
          }`}
          aria-label="PDF Settings"
        >
          <Settings className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${showSettings ? "rotate-90" : ""}`} />
        </Button>

        {/* Settings Popover - Professional Design with Left-side Opening */}
        {showSettings && (
          <div className="absolute top-0 right-12 bg-white shadow-2xl rounded-lg border border-gray-200/80 p-4 min-w-[240px] z-30 backdrop-blur-sm">
            {/* Arrow pointing right to the settings icon */}
            <div className="absolute top-4 -right-2 w-3 h-3 bg-white border-r border-b border-gray-200/80 rotate-45" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/60">
              <h3 className="text-sm font-semibold text-gray-900">Controls</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close settings"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {/* Zoom Controls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Zoom</span>
                  <span className="text-xs font-semibold text-gray-900">{zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom("out")}
                    disabled={zoom <= 50}
                    className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-30 transition-all shrink-0"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom("in")}
                    disabled={zoom >= 200}
                    className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-30 transition-all shrink-0"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Page Count */}
              {numPages > 0 && (
                <div className="pt-3 border-t border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Pages</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {numPages} {numPages === 1 ? "page" : "pages"}
                    </span>
                  </div>
                </div>
              )}

              {/* Security Indicator */}
              <div className="pt-3 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600">🔒</span>
                  <span className="text-gray-600">Protected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showSettings && (
        <div
          className="fixed inset-0 z-10"
          onClick={(e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
              setShowSettings(false)
            }
          }}
        />
      )}

      {/* PDF Viewer area - Fully responsive with adaptive padding and container sizing */}
      <div
        className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6"
        ref={canvasContainerRef}
        style={{
          scrollBehavior: "smooth",
        }}
      >
        {error ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-sm sm:max-w-md bg-white p-4 sm:p-6 rounded-lg shadow-md border border-red-200 mx-2">
              <p className="text-red-600 font-semibold mb-2 text-base sm:text-lg">Failed to load PDF</p>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{error}</p>
              <div className="text-xs text-gray-500 space-y-1 mt-2 text-left bg-gray-50 p-3 sm:p-4 rounded">
                <p className="font-medium text-gray-700 mb-1 sm:mb-2">
                  <strong>Note:</strong> Google Drive files often have CORS restrictions that prevent direct access.
                </p>
                <p className="font-medium text-gray-700 mb-1 sm:mb-2">
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 ml-2">
                  <li>Use a direct PDF URL from another hosting service (e.g., AWS S3, your own server)</li>
                  <li>Set up a backend API endpoint to proxy the PDF file</li>
                  <li>Ensure the Google Drive file is publicly accessible and try the direct download URL format</li>
                </ul>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-orange-500 mx-auto mb-3 sm:mb-4"></div>
              <div className="text-gray-600 font-medium text-sm sm:text-base">Loading PDF...</div>
            </div>
          </div>
        ) : numPages === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-gray-500 text-sm sm:text-base">No pages to display</div>
          </div>
        ) : null}
      </div>

      {/* Security notice footer */}
    </div>
  )
}
