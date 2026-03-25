'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { Stethoscope, User, Building2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSetup, setIsSetup] = useState(false)
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Setup form
  const [setupData, setSetupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: ''
  })

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/billing')
    }
  }, [user, isLoading, router])

  // Check if any user exists
  useEffect(() => {
    fetch('/api/auth/check-setup')
      .then(res => res.json())
      .then(data => setIsSetup(data.hasUser))
      .catch(() => setIsSetup(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }
    
    setIsSubmitting(true)
    const result = await login(loginEmail, loginPassword)
    setIsSubmitting(false)
    
    if (result.success) {
      router.push('/billing')
    } else {
      toast({ title: 'Login Failed', description: result.error, variant: 'destructive' })
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!setupData.email || !setupData.password || !setupData.name) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    
    if (setupData.password !== setupData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    
    if (setupData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }
    
    setIsSubmitting(true)
    const result = await login(setupData.email, setupData.password, {
      name: setupData.name,
      clinicName: setupData.clinicName,
      clinicAddress: setupData.clinicAddress,
      clinicPhone: setupData.clinicPhone
    })
    setIsSubmitting(false)
    
    if (result.success) {
      router.push('/billing')
    } else {
      toast({ title: 'Setup Failed', description: result.error, variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-14 w-14 bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Atom Medz</CardTitle>
            <CardDescription>
              Medical Billing & Inventory Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSetup ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="bg-primary/5 p-3 text-sm text-muted-foreground mb-4">
                  Welcome! Let&apos;s set up your account.
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setup-name">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="setup-name"
                      type="text"
                      placeholder="Dr. John Smith"
                      value={setupData.name}
                      onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setup-email">Email *</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={setupData.email}
                    onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setup-password">Password *</Label>
                    <Input
                      id="setup-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={setupData.password}
                      onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setup-confirm">Confirm Password *</Label>
                    <Input
                      id="setup-confirm"
                      type="password"
                      placeholder="Confirm password"
                      value={setupData.confirmPassword}
                      onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Clinic Information (Optional)</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinic-name">Clinic Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="clinic-name"
                        type="text"
                        placeholder="City Medical Center"
                        value={setupData.clinicName}
                        onChange={(e) => setSetupData({ ...setupData, clinicName: e.target.value })}
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="clinic-address">Clinic Address</Label>
                    <Input
                      id="clinic-address"
                      type="text"
                      placeholder="123 Medical Street, City"
                      value={setupData.clinicAddress}
                      onChange={(e) => setSetupData({ ...setupData, clinicAddress: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="clinic-phone">Clinic Phone</Label>
                    <Input
                      id="clinic-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={setupData.clinicPhone}
                      onChange={(e) => setSetupData({ ...setupData, clinicPhone: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Secure medical billing solution
        </p>
      </div>
    </div>
  )
}
