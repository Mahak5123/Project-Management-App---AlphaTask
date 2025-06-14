"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { PlusCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { ConfigNotice } from "@/components/config-notice"

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  created_by: string
}

interface Task {
  id: string
  title: string
  status: string
  project_name: string
  due_date: string | null
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user from localStorage
        const userData = localStorage.getItem("user")
        if (!userData) {
          return
        }

        const user = JSON.parse(userData)
        setCurrentUser(user)

        const supabase = createClient()

        try {
          // Fetch projects
          let projectsData: Project[] = []

          if (user.isCreator) {
            // If user is creator, fetch all projects they created
            const { data } = await supabase
              .from("projects")
              .select("*")
              .eq("created_by", user.id)
              .order("created_at", { ascending: false })
              .limit(5)

            projectsData = data || []
          } else {
            // If user is not creator, fetch projects where they are members
            const { data: memberProjects } = await supabase
              .from("project_members")
              .select(`
                project_id,
                projects(*)
              `)
              .eq("user_id", user.id)

            if (memberProjects) {
              projectsData = memberProjects
                .map((mp: any) => mp.projects)
                .filter(Boolean)
                .slice(0, 5)
            }
          }

          setProjects(projectsData)

          // Fetch tasks
          let tasksData: any[] = []

          if (user.isCreator) {
            // If user is creator, fetch all tasks from their projects
            const { data } = await supabase
              .from("tasks")
              .select(`
                id,
                title,
                status,
                due_date,
                projects(name)
              `)
              .in(
                "project_id",
                projectsData.map((p) => p.id),
              )
              .order("due_date", { ascending: true })
              .limit(10)

            tasksData = data || []
          } else {
            // If user is not creator, fetch tasks from projects they're members of
            const projectIds = projectsData.map((p) => p.id)

            if (projectIds.length > 0) {
              const { data } = await supabase
                .from("tasks")
                .select(`
                  id,
                  title,
                  status,
                  due_date,
                  projects(name)
                `)
                .in("project_id", projectIds)
                .order("due_date", { ascending: true })
                .limit(10)

              tasksData = data || []
            }
          }

          setTasks(
            tasksData.map((task: any) => ({
              ...task,
              project_name: task.projects?.name || "Unknown Project",
            })),
          )
        } catch (dbError) {
          console.error("Database error:", dbError)
          // Set empty data for development without a database
          setProjects([])
          setTasks([])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 && tasks.length === 0 && <ConfigNotice />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="mt-4 flex space-x-4 sm:mt-0">
          {/* Only show New Project button if user is creator */}
          {currentUser?.isCreator && (
            <Link href="/dashboard/projects/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {currentUser?.isCreator ? "My Projects" : "Projects I'm In"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tasks.filter((task) => task.status.toLowerCase() === "completed").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tasks.filter((task) => task.status.toLowerCase() === "in progress").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="space-y-4">
          {projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-4 text-center text-gray-500">
                  {currentUser?.isCreator
                    ? "No projects yet"
                    : "You haven't been added to any projects yet. Ask a project creator to add you as a member."}
                </p>
                {currentUser?.isCreator && (
                  <Link href="/dashboard/projects/new">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          {tasks.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b bg-gray-50 p-4 font-medium">
                <div className="col-span-5">Task</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Due Date</div>
              </div>
              {tasks.map((task) => (
                <div key={task.id} className="grid grid-cols-12 items-center p-4 hover:bg-gray-50">
                  <div className="col-span-5 font-medium">{task.title}</div>
                  <div className="col-span-3 text-sm text-gray-500">{task.project_name}</div>
                  <div className="col-span-2 flex items-center">
                    {getStatusIcon(task.status)}
                    <span className="ml-2 text-sm">{task.status}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">{formatDate(task.due_date)}</div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-4 text-center text-gray-500">
                  {currentUser?.isCreator ? "No tasks yet" : "No tasks found in your projects"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
