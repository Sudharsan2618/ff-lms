"use client";

import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Load pdfjs-dist from CDN to avoid Next.js webpack bundling issues
let pdfjsLib: any = null;
let pdfjsInitialized = false;
const PDFJS_VERSION = "3.11.174";

async function loadPdfjsFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    const win = window as any;

    const checkForPdfjs = () => {
      return (
        win.pdfjsLib?.getDocument ||
        win.pdfjs?.getDocument ||
        win.pdfjsLib ||
        win.pdfjs ||
        win.PDFJS?.getDocument ||
        win.pdfjsDist?.getDocument ||
        (typeof win.pdfjsLib !== "undefined" && win.pdfjsLib !== null) ||
        (typeof win.pdfjs !== "undefined" && win.pdfjs !== null)
      );
    };

    const getPdfjsFromWindow = () => {
      if (win.pdfjsLib && win.pdfjsLib.getDocument) return win.pdfjsLib;
      if (win.pdfjs && win.pdfjs.getDocument) return win.pdfjs;
      if (win.PDFJS && win.PDFJS.getDocument) return win.PDFJS;
      if (win.pdfjsDist && win.pdfjsDist.getDocument) return win.pdfjsDist;
      if (win.pdfjsLib) return win.pdfjsLib;
      if (win.pdfjs) return win.pdfjs;
      return null;
    };

    if (checkForPdfjs()) {
      const lib = getPdfjsFromWindow();
      if (lib && typeof lib.getDocument === "function") {
        if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
          lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
        }
        pdfjsLib = lib;
        pdfjsInitialized = true;
        resolve(lib);
        return;
      }
    }

    const existingScript = document.querySelector(
      `script[src*="pdf.js"]`
    ) as HTMLScriptElement;
    if (existingScript) {
      let attempts = 0;
      const maxAttempts = 100;
      const checkInterval = setInterval(() => {
        attempts++;
        if (checkForPdfjs()) {
          clearInterval(checkInterval);
          const pdfLib = getPdfjsFromWindow();
          if (pdfLib && typeof pdfLib.getDocument === "function") {
            if (
              pdfLib.GlobalWorkerOptions &&
              !pdfLib.GlobalWorkerOptions.workerSrc
            ) {
              pdfLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
            }
            pdfjsLib = pdfLib;
            pdfjsInitialized = true;
            resolve(pdfLib);
          } else {
            clearInterval(checkInterval);
            reject(new Error("PDF.js loaded but getDocument method not found"));
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(
            new Error("Timeout waiting for PDF.js to load after 10 seconds")
          );
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`;
    script.async = true;

    script.onload = () => {
      let attempts = 0;
      const maxAttempts = 50;
      const checkInterval = setInterval(() => {
        attempts++;
        if (checkForPdfjs()) {
          clearInterval(checkInterval);
          const pdfLib = getPdfjsFromWindow();
          if (pdfLib && typeof pdfLib.getDocument === "function") {
            if (pdfLib.GlobalWorkerOptions) {
              pdfLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
            }
            pdfjsLib = pdfLib;
            pdfjsInitialized = true;
            resolve(pdfLib);
          } else {
            reject(
              new Error(
                "PDF.js loaded but getDocument method is not a function."
              )
            );
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(
            new Error(
              `PDF.js script loaded but library not found on window after ${
                maxAttempts * 100
              }ms.`
            )
          );
        }
      }, 100);
    };

    script.onerror = () => {
      const fallbackScript = document.createElement("script");
      fallbackScript.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
      fallbackScript.async = true;

      fallbackScript.onload = () => {
        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
          attempts++;
          if (checkForPdfjs()) {
            clearInterval(checkInterval);
            const pdfLib = getPdfjsFromWindow();
            if (pdfLib && typeof pdfLib.getDocument === "function") {
              if (pdfLib.GlobalWorkerOptions) {
                pdfLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
              }
              pdfjsLib = pdfLib;
              pdfjsInitialized = true;
              resolve(pdfLib);
            } else {
              reject(
                new Error(
                  "PDF.js loaded from fallback CDN but getDocument method not found"
                )
              );
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error("Timeout loading PDF.js from fallback CDN"));
          }
        }, 100);
      };

      fallbackScript.onerror = () => {
        reject(
          new Error("Failed to load PDF.js from both CDNs (unpkg and cdnjs)")
        );
      };
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  });
}

async function getPdfjsLib() {
  if (typeof window === "undefined") return null;

  if (!pdfjsInitialized) {
    try {
      pdfjsLib = await loadPdfjsFromCDN();
    } catch (error) {
      console.error("Failed to load pdfjs-dist:", error);
      return null;
    }
  }
  return pdfjsLib;
}

interface AnimatedBookViewerProps {
  pdfUrl: string;
}

// Convert Google Drive URL to direct download URL
function convertGoogleDriveUrl(url: string): string {
  if (!url.includes("drive.google.com")) {
    return url;
  }

  const fileIdMatch = url.match(/[/]file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}

// Page component for the flipbook
interface PageProps {
  pageNumber: number;
  pageImage: string | null;
  isRendering: boolean;
  totalPages: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ pageNumber, pageImage, isRendering, totalPages }, ref) => {
    return (
      <div
        ref={ref}
        className="page-content bg-white shadow-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #fff 0%, #f8f6f3 100%)",
          borderRadius: "0 8px 8px 0",
        }}
      >
        {/* Page texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            opacity: 0.03,
            mixBlendMode: "multiply",
          }}
        />

        {/* Page edge shadow effect */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
          }}
        />

        {/* Page content */}
        <div className="relative h-full w-full flex items-center justify-center p-3">
          {isRendering ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500" />
                <BookOpen className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
              </div>
              <p className="mt-4 text-gray-500 text-sm font-medium">
                Loading page {pageNumber}...
              </p>
            </div>
          ) : pageImage ? (
            <img
              src={pageImage}
              alt={`Page ${pageNumber}`}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BookOpen className="h-12 w-12 mb-2" />
              <span className="text-sm">Page {pageNumber}</span>
            </div>
          )}
        </div>

        {/* Page number */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-xs text-gray-400 font-medium bg-white/80 px-3 py-1 rounded-full shadow-sm">
            {pageNumber} / {totalPages}
          </span>
        </div>
      </div>
    );
  }
);

Page.displayName = "Page";

export function AnimatedBookViewer({ pdfUrl }: AnimatedBookViewerProps) {
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageImages, setPageImages] = useState<Map<number, string>>(new Map());
  const [renderingPages, setRenderingPages] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookDimensions, setBookDimensions] = useState({
    width: 550,
    height: 750,
  });

  const directPdfUrl = convertGoogleDriveUrl(pdfUrl);

  // Calculate book dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // Calculate optimal book size - MUCH LARGER for readability
        // Each page takes about 45% of container width for two-page spread
        const maxWidth = Math.min(containerWidth * 0.44, 700); // Increased from 500
        const maxHeight = Math.min(containerHeight - 80, 900); // Increased from 700

        // Maintain a book-like aspect ratio
        const aspectRatio = 1.35; // Slightly less tall for better fit
        let width = maxWidth;
        let height = width * aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = height / aspectRatio;
        }

        // Ensure minimum readable size
        width = Math.max(width, 450);
        height = Math.max(height, 600);

        setBookDimensions({
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isFullscreen]);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await getPdfjsLib();
        if (!pdfjs || !pdfjs.getDocument) {
          throw new Error("Failed to load PDF.js library");
        }

        const loadingTask = pdfjs.getDocument({
          url: directPdfUrl,
          withCredentials: false,
          isEvalSupported: false,
          useSystemFonts: false,
        });

        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading PDF:", err);
        let errorMessage = "Failed to load PDF.";

        if (
          err.name === "UnexpectedResponseException" ||
          err.message?.includes("CORS")
        ) {
          errorMessage =
            "CORS error: The PDF server doesn't allow cross-origin requests.";
        } else if (err.name === "InvalidPDFException") {
          errorMessage =
            "Invalid PDF file or the URL doesn't point to a valid PDF document.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    loadPdf();
  }, [directPdfUrl]);

  // Render PDF pages to images
  const renderPageToImage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || pageImages.has(pageNum) || renderingPages.has(pageNum)) {
        return;
      }

      setRenderingPages((prev) => new Set(prev).add(pageNum));

      try {
        const page = await pdfDoc.getPage(pageNum);
        const scale = 2; // High quality rendering
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
        setPageImages((prev) => new Map(prev).set(pageNum, imageUrl));
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      } finally {
        setRenderingPages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pageNum);
          return newSet;
        });
      }
    },
    [pdfDoc, pageImages, renderingPages]
  );

  // Pre-render visible and nearby pages
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    const pagesToRender = [
      currentPage,
      currentPage + 1,
      currentPage + 2,
      currentPage + 3,
      currentPage - 1,
      currentPage - 2,
    ].filter((p) => p >= 1 && p <= numPages);

    pagesToRender.forEach((pageNum) => {
      renderPageToImage(pageNum);
    });
  }, [currentPage, pdfDoc, numPages, renderPageToImage]);

  // Initial render of first pages
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    // Render first 6 pages initially
    const initialPages = Math.min(6, numPages);
    for (let i = 1; i <= initialPages; i++) {
      renderPageToImage(i);
    }
  }, [pdfDoc, numPages, renderPageToImage]);

  const handlePageFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const goToPrevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const goToNextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Security measures
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventKeydown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" ||
          e.key === "a" ||
          e.key === "p" ||
          e.key === "s" ||
          e.key === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventKeydown);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventKeydown);
    };
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Generate pages array
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden ${
        isFullscreen
          ? "bg-slate-900"
          : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800"
      }`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Settings Icon */}
      <div className="absolute top-4 right-4 z-20" ref={settingsRef}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full transition-all duration-200 text-white"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full transition-all duration-200 text-white ${
              showSettings
                ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900"
                : ""
            }`}
            aria-label="PDF Settings"
          >
            <Settings
              className={`h-4 w-4 transition-transform duration-200 ${
                showSettings ? "rotate-90" : ""
              }`}
            />
          </Button>
        </div>

        {/* Settings Popover */}
        {showSettings && (
          <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl border border-gray-200/80 p-4 min-w-[220px] z-30">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/60">
              <h3 className="text-sm font-semibold text-gray-900">
                Book Settings
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 hover:bg-gray-100 rounded"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>

            <div className="space-y-3">
              {numPages > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      Pages
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {currentPage + 1} / {numPages}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600">🔒</span>
                  <span className="text-gray-600">Protected Content</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/60">
                <p className="text-xs text-gray-500">
                  Use arrow keys or click the page edges to flip pages
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Title Header */}
      <div className="relative z-10 text-center pt-4 pb-2">
        <h2 className="text-white/90 text-lg font-semibold tracking-wide flex items-center justify-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-400" />
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Course Material
          </span>
        </h2>
      </div>

      {/* Main Book Container */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        {error ? (
          <div className="text-center max-w-md bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-red-200">
            <p className="text-red-600 font-semibold mb-2 text-lg">
              Failed to load PDF
            </p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-orange-400/30 rounded-full animate-spin border-t-orange-500" />
              <BookOpen className="absolute inset-0 m-auto h-8 w-8 text-orange-400" />
            </div>
            <div className="text-white/80 font-medium text-lg">
              Loading your book...
            </div>
            <div className="text-white/50 text-sm mt-2">
              Please wait while we prepare the pages
            </div>
          </div>
        ) : numPages > 0 ? (
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {/* Left Navigation Button */}
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 0}
              className="group p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white group-hover:text-orange-400 transition-colors" />
            </button>

            {/* Book Container with Shadow and Spine Effect */}
            <div
              className="relative"
              style={{
                perspective: "2000px",
              }}
            >
              {/* Book Shadow */}
              <div
                className="absolute -inset-4 bg-black/40 blur-2xl rounded-lg"
                style={{
                  transform: "translateY(20px)",
                }}
              />

              {/* Book Spine Effect */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-4 md:w-6 -translate-x-1/2 z-10"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.1), rgba(0,0,0,0.3))",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)",
                }}
              />

              {/* The Flipbook */}
              <HTMLFlipBook
                ref={bookRef}
                width={bookDimensions.width}
                height={bookDimensions.height}
                size="stretch"
                minWidth={400}
                maxWidth={800}
                minHeight={550}
                maxHeight={1000}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={handlePageFlip}
                className="book-flipbook"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={800}
                usePortrait={false}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {pages.map((pageNum) => (
                  <Page
                    key={pageNum}
                    pageNumber={pageNum}
                    pageImage={pageImages.get(pageNum) || null}
                    isRendering={renderingPages.has(pageNum)}
                    totalPages={numPages}
                  />
                ))}
              </HTMLFlipBook>
            </div>

            {/* Right Navigation Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages - 1}
              className="group p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Next page"
            >
              <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white group-hover:text-orange-400 transition-colors" />
            </button>
          </div>
        ) : (
          <div className="text-white/60">No pages to display</div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      {numPages > 0 && !loading && (
        <div className="relative z-10 py-4 px-4">
          <div className="max-w-lg mx-auto">
            {/* Page Progress Bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{
                  width: `${((currentPage + 1) / numPages) * 100}%`,
                }}
              />
            </div>

            {/* Page Info */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/50 text-sm">
                Swipe or click to flip pages
              </span>
              <span className="text-white/80 text-sm font-medium">
                Page {currentPage + 1} of {numPages}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Navigation Hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity">
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/60 text-xs">
          Use ← → arrow keys to navigate
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .book-flipbook {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border-radius: 4px;
        }

        .book-flipbook .stf__parent {
          overflow: visible !important;
        }

        .page-content {
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.03),
            0 0 15px rgba(0, 0, 0, 0.1);
        }

        @keyframes pageShine {
          0% {
            opacity: 0;
            transform: translateX(-100%);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
