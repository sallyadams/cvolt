"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function CVUploadPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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
        // For PDF, we'd need to parse it. For now, assume text file or handle PDF parsing
        if (file.type === "text/plain") {
          cvText = await file.text()
        } else {
          // PDF parsing would go here - for MVP, show error
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
        // Redirect to ATS scan or results
        router.push(`/app/scan/${data.cvId}`)
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

  if (!session) {
    return <div>Please sign in first</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Upload Your CV
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We'll analyze it and show you why you're not getting interviews
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF or Text File
            </label>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or paste your CV text</span>
            </div>
          </div>

          <div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste your CV content here..."
              rows={10}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isUploading ? "Analyzing..." : "Analyze My CV"}
          </button>
        </form>
      </div>
    </div>
  )
}