"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function NewProject() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!name) throw new Error("Project name can't be empty")

      const supabase = createClient()
      const userData = localStorage.getItem("user")
      if (!userData) throw new Error("Please log in first")

      const user = JSON.parse(userData)

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (projectError) throw projectError

      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong while creating the project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-[#00FFFF]">
        Start a New Project
      </h1>

      <Card className="bg-[#001524] border border-[#00FFFF] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#00FFFF]">Project Info</CardTitle>
          <CardDescription className="text-white/70">
            Fill in your project's details below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="new-project-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bug Tracker UI"
                required
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Project Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your project"
                className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            onClick={() => router.back()}
            className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="new-project-form"
            disabled={loading}
            className="bg-[#00FFFF] text-black hover:bg-[#00dddd]"
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}