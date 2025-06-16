"use client"

import { useEffect, useState, FormEvent } from "react"
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
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

  const [currentPasscode, setCurrentPasscode] = useState("")
  const [newPasscode, setNewPasscode] = useState("")
  const [confirmPasscode, setConfirmPasscode] = useState("")
  const [passcodeLoading, setPasscodeLoading] = useState(false)
  const [passcodeError, setPasscodeError] = useState("")
  const [passcodeSuccess, setPasscodeSuccess] = useState("")

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

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setProfileLoading(true)
    setProfileError("")
    setProfileSuccess("")

    try {
      const supabase = createClient()
      const { error } = await supabase.from("users").update({ name, email }).eq("id", user.id)
      if (error) throw error

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      localStorage.setItem("user", JSON.stringify({ ...storedUser, name, email }))

      setProfileSuccess("Profile updated successfully.")
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePasscode = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setPasscodeLoading(true)
    setPasscodeError("")
    setPasscodeSuccess("")

    try {
      if (newPasscode !== confirmPasscode) throw new Error("New passcodes do not match.")
      if (currentPasscode !== user.passcode) throw new Error("Current passcode is incorrect.")

      const supabase = createClient()
      const { error } = await supabase.from("users").update({ passcode: newPasscode }).eq("id", user.id)
      if (error) throw error

      setUser({ ...user, passcode: newPasscode })
      setCurrentPasscode("")
      setNewPasscode("")
      setConfirmPasscode("")
      setPasscodeSuccess("Passcode updated successfully.")
    } catch (err: any) {
      setPasscodeError(err.message || "Failed to change passcode.")
    } finally {
      setPasscodeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="w-14 h-14 border-[5px] border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <Card className="w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
            <CardDescription>Unable to load user data. Please login again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
<div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] pt-0 pb-0 px-0">

      <h1 className="text-4xl font-bold text-white mb-12 text-center tracking-tight"> Account Settings</h1>

      <div className="grid gap-10 md:grid-cols-2 max-w-6xl mx-auto">
        {/* Profile Card */}
        <Card className="bg-[#1e293b]/80 border border-[#334155] text-white shadow-xl rounded-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profile</CardTitle>
            <CardDescription className="text-gray-400">Manage your name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-5">
              {profileError && <Alert variant="destructive"><AlertDescription>{profileError}</AlertDescription></Alert>}
              {profileSuccess && <Alert className="bg-green-600 border-green-600 text-white"><AlertDescription>{profileSuccess}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" className="bg-[#334155] text-white placeholder:text-gray-400 focus:ring-cyan-400" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className="bg-[#334155] text-white placeholder:text-gray-400 focus:ring-cyan-400" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="profile-form" disabled={profileLoading} className="w-full bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 transition-all">
              {profileLoading ? "Updating..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        {/* Passcode Card */}
        <Card className="bg-[#1e293b]/80 border border-[#334155] text-white shadow-xl rounded-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Change Passcode</CardTitle>
            <CardDescription className="text-gray-400">Set a new secure passcode</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="passcode-form" onSubmit={handleChangePasscode} className="space-y-5">
              {passcodeError && <Alert variant="destructive"><AlertDescription>{passcodeError}</AlertDescription></Alert>}
              {passcodeSuccess && <Alert className="bg-green-600 border-green-600 text-white"><AlertDescription>{passcodeSuccess}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label htmlFor="current-passcode">Current Passcode</Label>
                <Input id="current-passcode" type="password" className="bg-[#334155] text-white placeholder:text-gray-400 focus:ring-cyan-400" value={currentPasscode} onChange={(e) => setCurrentPasscode(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-passcode">New Passcode</Label>
                <Input id="new-passcode" type="password" className="bg-[#334155] text-white placeholder:text-gray-400 focus:ring-cyan-400" value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-passcode">Confirm New Passcode</Label>
                <Input id="confirm-passcode" type="password" className="bg-[#334155] text-white placeholder:text-gray-400 focus:ring-cyan-400" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} required />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="passcode-form" disabled={passcodeLoading} className="w-full bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 transition-all">
              {passcodeLoading ? "Updating..." : "Update Passcode"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
