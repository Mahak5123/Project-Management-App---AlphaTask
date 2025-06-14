"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  name: string
  email: string
  passcode: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPasscode, setCurrentPasscode] = useState("")
  const [newPasscode, setNewPasscode] = useState("")
  const [confirmPasscode, setConfirmPasscode] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) return

        const parsedUser = JSON.parse(userData)

        const supabase = createClient()
        const { data, error } = await supabase.from("users").select("*").eq("id", parsedUser.id).single()

        if (error) throw error

        setUser(data)
        setName(data.name)
        setEmail(data.email)
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError("")
    setSuccess("")

    try {
      if (!user) return

      const supabase = createClient()

      // Update user profile
      const { error } = await supabase.from("users").update({ name, email }).eq("id", user.id)

      if (error) throw error

      // Update local storage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          name,
          email,
        }),
      )

      setSuccess("Profile updated successfully")
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile")
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError("")
    setSuccess("")

    try {
      if (!user) return

      if (newPasscode !== confirmPasscode) {
        throw new Error("New passcodes do not match")
      }

      if (currentPasscode !== user.passcode) {
        throw new Error("Current passcode is incorrect")
      }

      const supabase = createClient()

      // Update passcode
      const { error } = await supabase.from("users").update({ passcode: newPasscode }).eq("id", user.id)

      if (error) throw error

      // Reset form
      setCurrentPasscode("")
      setNewPasscode("")
      setConfirmPasscode("")

      // Update local user data
      setUser({
        ...user,
        passcode: newPasscode,
      })

      setSuccess("Passcode changed successfully")
    } catch (err: any) {
      console.error("Error changing passcode:", err)
      setError(err.message || "Failed to change passcode")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load user data. Please try logging in again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="profile-form" disabled={updating}>
              {updating ? "Updating..." : "Update Profile"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Passcode</CardTitle>
            <CardDescription>Update your account passcode</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="passcode-form" onSubmit={handleChangePasscode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-passcode">Current Passcode</Label>
                <Input
                  id="current-passcode"
                  type="password"
                  value={currentPasscode}
                  onChange={(e) => setCurrentPasscode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-passcode">New Passcode</Label>
                <Input
                  id="new-passcode"
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-passcode">Confirm New Passcode</Label>
                <Input
                  id="confirm-passcode"
                  type="password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  required
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="passcode-form" disabled={updating}>
              {updating ? "Updating..." : "Change Passcode"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
