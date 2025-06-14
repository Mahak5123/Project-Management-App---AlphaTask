"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { PlusCircle, CheckCircle2, Clock, AlertCircle, Calendar, User } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: string
  due_date: string | null
  project_id: string
  assigned_to: string | null
  created_at: string
  project: {
    name: string
    id: string
  }
  assigned_user?: {
    name: string
    email: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; isCreator: boolean } | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const user = JSON.parse(userData)
        setCurrentUser(user)

        const supabase = createClient()

        let tasksQuery

        if (user.isCreator) {
          // If user is creator, fetch all tasks from their projects
          const { data: userProjects } = await supabase.from("projects").select("id").eq("created_by", user.id)

          if (userProjects && userProjects.length > 0) {
            const projectIds = userProjects.map((p) => p.id)

            tasksQuery = supabase
              .from("tasks")
              .select(`
                *,
                project:projects(name, id),
                assigned_user:users(name, email)
              `)
              .in("project_id", projectIds)
          } else {
            setTasks([])
            setLoading(false)
            return
          }
        } else {
          // If user is not creator, fetch tasks from projects they're members of
          const { data: memberProjects } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", user.id)

          if (memberProjects && memberProjects.length > 0) {
            const projectIds = memberProjects.map((mp) => mp.project_id)

            tasksQuery = supabase
              .from("tasks")
              .select(`
                *,
                project:projects(name, id),
                assigned_user:users(name, email)
              `)
              .in("project_id", projectIds)
          } else {
            setTasks([])
            setLoading(false)
            return
          }
        }

        const { data: tasksData, error } = await tasksQuery.order("due_date", { ascending: true, nullsLast: true })

        if (error) throw error

        setTasks(tasksData || [])
      } catch (err) {
        console.error("Error fetching tasks:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day(s)`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${diffDays} day(s)`
    }
  }

  const getDateColor = (dateString: string | null) => {
    if (!dateString) return "text-gray-500"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "text-red-600"
    if (diffDays === 0) return "text-orange-600"
    if (diffDays <= 3) return "text-yellow-600"
    return "text-gray-500"
  }

  const filterTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status.toLowerCase() === status.toLowerCase())
  }

  const getMyTasks = () => {
    return tasks.filter((task) => task.assigned_to === currentUser?.id)
  }

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="mt-1">
              <Link href={`/dashboard/projects/${task.project.id}`} className="text-blue-600 hover:underline">
                {task.project.name}
              </Link>
            </CardDescription>
          </div>
          <Badge className={getStatusColor(task.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(task.status)}
              {task.status}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${getDateColor(task.due_date)}`}>
                <Calendar className="h-4 w-4" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
            {task.assigned_user && (
              <div className="flex items-center gap-1 text-gray-600">
                <User className="h-4 w-4" />
                <span>{task.assigned_user.name}</span>
              </div>
            )}
          </div>
          <Link href={`/dashboard/projects/${task.project.id}`}>
            <Button variant="ghost" size="sm">
              View Project
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderTaskList = (taskList: Task[], emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="mb-4 text-center text-gray-500">{emptyMessage}</p>
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
      )
    }

    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{taskList.map(renderTaskCard)}</div>
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const myTasks = getMyTasks()
  const todoTasks = filterTasksByStatus("to do")
  const inProgressTasks = filterTasksByStatus("in progress")
  const completedTasks = filterTasksByStatus("completed")
  const blockedTasks = filterTasksByStatus("blocked")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="mt-4 flex space-x-4 sm:mt-0">
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderTaskList(tasks, "No tasks found. Create a project and add some tasks to get started.")}
        </TabsContent>

        <TabsContent value="my-tasks">{renderTaskList(myTasks, "No tasks assigned to you yet.")}</TabsContent>

        <TabsContent value="todo">{renderTaskList(todoTasks, "No tasks in 'To Do' status.")}</TabsContent>

        <TabsContent value="in-progress">
          {renderTaskList(inProgressTasks, "No tasks in 'In Progress' status.")}
        </TabsContent>

        <TabsContent value="completed">{renderTaskList(completedTasks, "No completed tasks yet.")}</TabsContent>

        <TabsContent value="blocked">{renderTaskList(blockedTasks, "No blocked tasks.")}</TabsContent>
      </Tabs>
    </div>
  )
}
