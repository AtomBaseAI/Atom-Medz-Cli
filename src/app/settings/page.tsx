'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Lock,
  Save,
  Eye,
  EyeOff,
  Percent,
  Tag,
  Plus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

interface Settings {
  id: string
  taxEnabled: boolean
  gstNumber: string | null
  cgstPercentage: number
  sgstPercentage: number
  offersEnabled: boolean
}

interface Offer {
  id: string
  name: string
  percentage: number
  active: boolean
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: ''
  })
  
  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Settings
  const [settings, setSettings] = useState<Settings | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [offerForm, setOfferForm] = useState({ name: '', percentage: '' })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        clinicName: user.clinicName || '',
        clinicAddress: user.clinicAddress || '',
        clinicPhone: user.clinicPhone || ''
      })
    }
    fetchSettings()
    fetchOffers()
  }, [user])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/offers')
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error('Failed to fetch offers:', error)
    }
  }

  const handleUpdateProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      if (res.ok) {
        const data = await res.json()
        updateUser(data.user)
        toast({ title: 'Success', description: 'Profile updated successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    
    if (passwords.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      })
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Password changed successfully' })
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to change password', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSettings = async (data: Partial<Settings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...data })
      })
      
      if (res.ok) {
        const result = await res.json()
        setSettings(result.settings)
        toast({ title: 'Success', description: 'Settings updated successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
    }
  }

  const handleAddOffer = async () => {
    if (!offerForm.name || !offerForm.percentage) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: offerForm.name,
          percentage: parseFloat(offerForm.percentage),
          active: true
        })
      })
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Offer added successfully' })
        fetchOffers()
        setOfferForm({ name: '', percentage: '' })
        setShowOfferDialog(false)
      } else {
        toast({ title: 'Error', description: 'Failed to add offer', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add offer', variant: 'destructive' })
    }
  }

  const handleUpdateOffer = async () => {
    if (!editingOffer) return

    try {
      const res = await fetch(`/api/offers/${editingOffer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: offerForm.name,
          percentage: parseFloat(offerForm.percentage),
          active: editingOffer.active
        })
      })
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Offer updated successfully' })
        fetchOffers()
        setOfferForm({ name: '', percentage: '' })
        setEditingOffer(null)
      } else {
        toast({ title: 'Error', description: 'Failed to update offer', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update offer', variant: 'destructive' })
    }
  }

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Offer deleted successfully' })
        fetchOffers()
      } else {
        toast({ title: 'Error', description: 'Failed to delete offer', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete offer', variant: 'destructive' })
    }
  }

  const toggleOfferActive = async (offer: Offer) => {
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: offer.name,
          percentage: offer.percentage,
          active: !offer.active
        })
      })
      
      if (res.ok) {
        fetchOffers()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle offer', variant: 'destructive' })
    }
  }

  const openEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setOfferForm({ name: offer.name, percentage: offer.percentage.toString() })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Row 1: Profile and Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Clinic Information</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input
                    value={profile.clinicName}
                    onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
                    placeholder="Clinic name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clinic Phone</Label>
                  <Input
                    value={profile.clinicPhone}
                    onChange={(e) => setProfile({ ...profile, clinicPhone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Clinic Address</Label>
                <Input
                  value={profile.clinicAddress}
                  onChange={(e) => setProfile({ ...profile, clinicAddress: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="New password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button onClick={handleChangePassword} disabled={isLoading || !passwords.currentPassword || !passwords.newPassword}>
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Tax and Offers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <CardTitle>Tax Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="tax-toggle" className="text-sm text-muted-foreground">Enable GST</Label>
                  <Switch
                    id="tax-toggle"
                    checked={settings?.taxEnabled ?? false}
                    onCheckedChange={(checked) => handleUpdateSettings({ taxEnabled: checked })}
                  />
                </div>
              </div>
              <CardDescription>Configure tax settings for bills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={settings?.gstNumber || ''}
                  onChange={(e) => handleUpdateSettings({ gstNumber: e.target.value })}
                  disabled={!settings?.taxEnabled}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CGST (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={settings?.cgstPercentage || 0}
                    onChange={(e) => handleUpdateSettings({ cgstPercentage: parseFloat(e.target.value) || 0 })}
                    disabled={!settings?.taxEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SGST (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={settings?.sgstPercentage || 0}
                    onChange={(e) => handleUpdateSettings({ sgstPercentage: parseFloat(e.target.value) || 0 })}
                    disabled={!settings?.taxEnabled}
                  />
                </div>
              </div>
              {settings?.taxEnabled && (
                <div className="p-3 bg-muted/50 text-sm">
                  <p className="text-muted-foreground">
                    Total GST: <span className="font-medium text-foreground">{(settings.cgstPercentage + settings.sgstPercentage).toFixed(1)}%</span>
                    (CGST {settings.cgstPercentage}% + SGST {settings.sgstPercentage}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offers Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <CardTitle>Offers & Discounts</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="offers-toggle" className="text-sm text-muted-foreground">Enable Offers</Label>
                  <Switch
                    id="offers-toggle"
                    checked={settings?.offersEnabled ?? false}
                    onCheckedChange={(checked) => handleUpdateSettings({ offersEnabled: checked })}
                  />
                </div>
              </div>
              <CardDescription>Manage discount offers for billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowOfferDialog(true)}
                disabled={!settings?.offersEnabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Offer
              </Button>
              
              {offers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.name}</TableCell>
                        <TableCell className="text-right">{offer.percentage}%</TableCell>
                        <TableCell>
                          <Switch
                            checked={offer.active}
                            onCheckedChange={() => toggleOfferActive(offer)}
                            disabled={!settings?.offersEnabled}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditOffer(offer)}
                            disabled={!settings?.offersEnabled}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteOffer(offer.id)}
                            disabled={!settings?.offersEnabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No offers added yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* App Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>About</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Atom Medz</strong> - Medical Billing System</p>
              <p>Version 1.0.0</p>
              <p>A simple and efficient billing solution for medical clinics.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Offer Dialog */}
      <Dialog open={showOfferDialog || !!editingOffer} onOpenChange={(open) => {
        if (!open) {
          setShowOfferDialog(false)
          setEditingOffer(null)
          setOfferForm({ name: '', percentage: '' })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
            <DialogDescription>
              {editingOffer ? 'Update offer details' : 'Create a new discount offer'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Offer Name</Label>
              <Input
                placeholder="e.g., Summer Discount"
                value={offerForm.name}
                onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={offerForm.percentage}
                onChange={(e) => setOfferForm({ ...offerForm, percentage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowOfferDialog(false)
              setEditingOffer(null)
              setOfferForm({ name: '', percentage: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={editingOffer ? handleUpdateOffer : handleAddOffer}>
              {editingOffer ? 'Update' : 'Add'} Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
