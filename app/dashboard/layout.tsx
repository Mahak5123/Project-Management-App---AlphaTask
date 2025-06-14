"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut, Menu, X, PlusCircle } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface User {
  id: string
  name: string
  email: string
  isCreator: boolean
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-500">Project</span>
          <span className="text-xl font-bold text-blue-500">Pilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white pt-16">
          <div className="flex flex-col p-4 space-y-4">
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar>
                <AvatarFallback className="bg-orange-100 text-orange-500">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Link href="/dashboard" onClick={toggleMobileMenu}>
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/projects/new" onClick={toggleMobileMenu}>
              <Button variant="ghost" className="w-full justify-start">
                <PlusCircle className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </Link>
            <Link href="/dashboard/tasks" onClick={toggleMobileMenu}>
              <Button variant="ghost" className="w-full justify-start">
                <CheckSquare className="mr-2 h-5 w-5" />
                Tasks
              </Button>
            </Link>
            {user?.isCreator && (
              <Link href="/dashboard/members" onClick={toggleMobileMenu}>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-5 w-5" />
                  Team Members
                </Button>
              </Link>
            )}
            <Link href="/dashboard/settings" onClick={toggleMobileMenu}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                handleLogout()
                toggleMobileMenu()
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col border-r bg-gray-50">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500">Project</span>
            <span className="text-xl font-bold text-blue-500">Pilot</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <Avatar>
              <AvatarFallback className="bg-orange-100 text-orange-500">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start" data-active={pathname === "/dashboard"}>
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/projects/new">
              <Button
                variant="ghost"
                className="w-full justify-start"
                data-active={pathname === "/dashboard/projects/new"}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" className="w-full justify-start" data-active={pathname === "/dashboard/tasks"}>
                <CheckSquare className="mr-2 h-5 w-5" />
                Tasks
              </Button>
            </Link>
            {user?.isCreator && (
              <Link href="/dashboard/members">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  data-active={pathname === "/dashboard/members"}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Team Members
                </Button>
              </Link>
            )}
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start" data-active={pathname === "/dashboard/settings"}>
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </Link>
          </nav>
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <main className="container mx-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
