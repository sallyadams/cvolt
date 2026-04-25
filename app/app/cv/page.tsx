"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CVDocument {
  id: string
  filename: string
  createdAt: string
  version: number
}

export default function CVPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cvs, setCvs] = useState<CVDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchCVs()
    }
  }, [status, router])

  const fetchCVs = async () => {
    try {
      const response = await fetch('/api/cv')
      if (response.ok) {
        const data = await response.json()
        setCvs(data)
      }
    } catch (error) {
      console.error('Failed to fetch CVs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" || selectedFile.type === "text/plain") {
        setFile(selectedFile)
        setText("")
        setError("")
      } else {
        setError("Please select a PDF or text file")
      }
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setFile(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !text.trim()) {
      setError("Please upload a file or paste your CV text")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      let cvText = text

      if (file) {
        if (file.type === "text/plain") {
          cvText = await file.text()
        } else {
          setError("PDF parsing not implemented yet. Please paste text instead.")
          setIsUploading(false)
          return
        }
      }

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cvText }),
      })

      if (response.ok) {
        const data = await response.json()
        fetchCVs() // Refresh the list
        setShowUpload(false)
        setFile(null)
        setText("")
        router.push(`/scan/${data.cvId}`)
      } else {
        const data = await response.json()
        setError(data.error || "Upload failed")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setIsUploading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My CVs</h1>
          <p className="mt-2 text-gray-600">
            Manage and optimize your CVs for better job matches
          </p>
        </div>

        {/* CV List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your CVs</h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showUpload ? 'Cancel Upload' : 'Upload New CV'}
            </button>
          </div>

          {cvs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 mb-4">No CVs uploaded yet.</p>
              <button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Upload Your First CV
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cvs.map((cv) => (
                <div key={cv.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{cv.filename}</h3>
                      <p className="text-sm text-gray-500">
                        Version {cv.version} • Uploaded {new Date(cv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Link
                      href={`/cv/${cv.id}/edit`}
                      className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/scan/${cv.id}`}
                      className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      ATS Scan
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload New CV
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF or Text File
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or paste your CV text</span>
                </div>
              </div>

              <div>
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Paste your CV content here..."
                  rows={10}
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? "Analyzing..." : "Analyze My CV"}
              </button>
            </form>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}