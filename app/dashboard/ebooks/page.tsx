"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Book, ExternalLink, Search } from "lucide-react"

interface Ebook {
  e_book_id: number
  e_book_name: string
  domain: string
  e_book_object_url: string
  updated_date: string
}

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [groupedEbooks, setGroupedEbooks] = useState<Record<string, Ebook[]>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true)
        const response = await api.get("/ebooks")
        setEbooks(response.data.ebooks || [])
      } catch (error) {
        console.error("Error fetching ebooks:", error)
        toast({
          title: "Error",
          description: "Failed to load ebooks",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEbooks()
  }, [toast])

  useEffect(() => {
    // Group ebooks by domain
    const grouped = ebooks.reduce(
      (acc, ebook) => {
        if (!acc[ebook.domain]) {
          acc[ebook.domain] = []
        }
        acc[ebook.domain].push(ebook)
        return acc
      },
      {} as Record<string, Ebook[]>,
    )

    setGroupedEbooks(grouped)
  }, [ebooks])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold">Ebooks Library</h1>
          <p className="text-gray-500 mt-1">Explore our collection of educational resources</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="h-[320px] bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
          </div>
        ) : Object.keys(groupedEbooks).length > 0 ? (
          Object.entries(groupedEbooks).map(([domain, domainEbooks]) => (
            <div key={domain} className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">{domain}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {domainEbooks.map((ebook) => (
                  <Card key={ebook.e_book_id} className="overflow-hidden flex flex-col">
                    <div className="relative h-52 bg-gray-100 flex items-center justify-center">
                      <Book className="h-16 w-16 text-gray-400" />
                    </div>
                    <CardContent className="flex-grow p-4">
                      <h3 title={ebook.e_book_name} className="text-lg font-semibold mb-2 line-clamp-1">
                        {ebook.e_book_name}
                      </h3>
                      <span className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                        {ebook.domain}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        Updated: {new Date(ebook.updated_date).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full" variant="outline" asChild>
                        <a
                          href={ebook.e_book_object_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          Read Ebook <ExternalLink size={16} />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No ebooks found</h3>
            <p className="text-gray-500">Check back later for new resources</p>
          </div>
        )}
      </div>
    </div>
  )
}
