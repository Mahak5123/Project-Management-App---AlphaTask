"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, Trash2, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  is_creator: boolean
  created_at: string
}

interface Project {
  id: string
  name: string
}

interface ProjectMember {
  project_id: string
  user_id: string
  role: string
  added_at: string
  user: User
}

export default function MembersPage() {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addedMember, setAddedMember] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const user = JSON.parse(userData)
        setCurrentUser(user)
        setIsCreator(user.isCreator)

        if (!user.isCreator) {
          setLoading(false)
          return
        }

        const supabase = createClient()

        // Fetch projects created by this user
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, name")
          .eq("created_by", user.id)
          .order("name")

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // Set default selected project if available
        if (projectsData && projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id)

          // Fetch members for the first project
          await fetchProjectMembers(projectsData[0].id)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchProjectMembers = async (projectId: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch project members with user details
      // Note: We're not selecting 'id' since it doesn't exist in the table
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          project_id,
          user_id,
          role,
          added_at,
          user:users(id, name, email, is_creator)
        `)
        .eq("project_id", projectId)
        .order("added_at", { ascending: false })

      if (error) {
        console.error("Error fetching project members:", error)
        throw error
      }

      // Also add the project creator as a member
      const { data: projectData } = await supabase.from("projects").select("created_by").eq("id", projectId).single()

      if (projectData) {
        const { data: creatorData } = await supabase
          .from("users")
          .select("id, name, email, is_creator")
          .eq("id", projectData.created_by)
          .single()

        if (creatorData) {
          // Check if creator is already in the members list
          const creatorExists = data?.some((member) => member.user.id === creatorData.id)

          if (!creatorExists) {
            // Add creator to the beginning of the list
            const creatorMember = {
              project_id: projectId,
              user_id: creatorData.id,
              role: "creator",
              added_at: new Date().toISOString(),
              user: creatorData,
            }

            setMembers([creatorMember, ...(data || [])])
            return
          }
        }
      }

      setMembers(data || [])
    } catch (err) {
      console.error("Error fetching project members:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    fetchProjectMembers(projectId)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      if (!newMemberEmail) {
        setError("Please provide an email address")
        return
      }

      if (!selectedProjectId) {
        setError("Please select a project")
        return
      }

      const supabase = createClient()

      // Check if user with this email exists
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", newMemberEmail)
        .single()

      if (userError || !existingUser) {
        setError("No user found with this email address. They need to register first.")
        return
      }

      // Check if user is already a member of this project
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", selectedProjectId)
        .eq("user_id", existingUser.id)
        .single()

      if (existingMember) {
        setError("This user is already a member of the selected project")
        return
      }

      // Add user to project_members
      const { error: insertError } = await supabase.from("project_members").insert([
        {
          project_id: selectedProjectId,
          user_id: existingUser.id,
          role: "member",
        },
      ])

      if (insertError) throw insertError

      // Refresh the members list
      await fetchProjectMembers(selectedProjectId)

      setAddedMember(existingUser)
      setSuccess("Member added successfully")
      setDialogOpen(true)

      // Reset form
      setNewMemberEmail("")
    } catch (err: any) {
      console.error("Error adding member:", err)
      setError(err.message || "Failed to add member")
    }
  }

  const handleRemoveMember = async (projectId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      // Don't allow removing the creator
      const memberToRemove = members.find((member) => member.user.id === userId)
      if (memberToRemove?.role === "creator") {
        setError("You cannot remove the project creator")
        return
      }

      const supabase = createClient()

      // Remove from project_members table using composite key
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId)

      if (error) throw error

      // Update member list
      setMembers(members.filter((member) => !(member.project_id === projectId && member.user_id === userId)))
      setSuccess("Member removed successfully")
    } catch (err: any) {
      console.error("Error removing member:", err)
      setError(err.message || "Failed to remove member")
    }
  }

  if (loading && !members.length) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!isCreator) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only the creator of the project can manage team members.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
            <CardDescription>You need to create a project before you can add team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/dashboard/projects/new")}>Create a Project</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>Choose which project to manage team members for</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add Existing Member</CardTitle>
                <CardDescription>Add an existing user to your project team</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && !dialogOpen && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter member's email"
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You can only add users who have already registered with ProjectPilot.
                    </AlertDescription>
                  </Alert>
                </form>
              </CardContent>
              <CardFooter>
                <Button type="submit" form="add-member-form">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members for {projects.find((p) => p.id === selectedProjectId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div
                        key={`${member.project_id}-${member.user_id}`}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                          {member.role === "creator" && (
                            <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                              Creator
                            </span>
                          )}
                        </div>
                        {member.role !== "creator" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.project_id, member.user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No members found for this project</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Added Successfully</DialogTitle>
            <DialogDescription>{addedMember?.name} has been added to your project team.</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-100 rounded-md">
            <p className="font-medium">Member Details:</p>
            <p className="mt-1">Name: {addedMember?.name}</p>
            <p>Email: {addedMember?.email}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
