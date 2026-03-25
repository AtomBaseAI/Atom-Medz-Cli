'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  Save, 
  FileText, 
  User, 
  Package,
  AlertCircle,
  Tag,
  History
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

interface InventoryItem {
  id: string
  name: string
  category?: string | null
  unit: string
  unitPrice: number
  stockQuantity: number
}

interface Patient {
  id: string
  name: string
  phone?: string | null
  address?: string | null
}

interface BillItem {
  id: string
  inventoryItemId?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

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

export default function BillingPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  
  // Bill form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [items, setItems] = useState<BillItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedOfferId, setSelectedOfferId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [notes, setNotes] = useState('')
  
  // Search and selection
  const [itemSearch, setItemSearch] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  
  // Refs
  const itemSearchRef = useRef<HTMLInputElement>(null)

  // Fetch data
  useEffect(() => {
    fetchInventory()
    fetchPatients()
    fetchSettings()
    fetchOffers()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      setInventory(data.items || [])
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault()
            clearBill()
            break
          case 's':
            e.preventDefault()
            handleSaveBill()
            break
          case 'p':
            e.preventDefault()
            if (items.length > 0) {
              handlePrint()
            }
            break
          case 'a':
            e.preventDefault()
            setShowItemDialog(true)
            setTimeout(() => itemSearchRef.current?.focus(), 100)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items])

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  
  // Calculate tax based on settings
  const cgstAmount = settings?.taxEnabled ? (subtotal * (settings.cgstPercentage / 100)) : 0
  const sgstAmount = settings?.taxEnabled ? (subtotal * (settings.sgstPercentage / 100)) : 0
  const totalTax = cgstAmount + sgstAmount
  
  // Calculate discount from offer or manual
  const selectedOffer = offers.find(o => o.id === selectedOfferId)
  const offerDiscount = selectedOffer ? (subtotal * (selectedOffer.percentage / 100)) : 0
  const manualDiscount = selectedOfferId ? 0 : discount
  const totalDiscount = offerDiscount + manualDiscount
  
  const total = subtotal + totalTax - totalDiscount

  // Add item to bill
  const addItem = (item: InventoryItem) => {
    const existingIndex = items.findIndex(i => i.inventoryItemId === item.id)
    
    if (existingIndex >= 0) {
      const updatedItems = [...items]
      updatedItems[existingIndex].quantity += 1
      updatedItems[existingIndex].totalPrice = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice
      setItems(updatedItems)
    } else {
      setItems([...items, {
        id: Date.now().toString(),
        inventoryItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice
      }])
    }
    
    setShowItemDialog(false)
    setItemSearch('')
    toast({ title: 'Item added', description: `${item.name} added to bill` })
  }

  // Remove item from bill
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ))
  }

  // Clear bill
  const clearBill = () => {
    setSelectedPatientId('')
    setNewPatientName('')
    setNewPatientPhone('')
    setItems([])
    setDiscount(0)
    setSelectedOfferId('')
    setPaymentMethod('cash')
    setPaymentStatus('paid')
    setNotes('')
    toast({ title: 'New bill', description: 'Ready for new billing' })
  }

  // Save bill
  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' })
      return
    }
    
    if (!selectedPatientId && !newPatientName) {
      toast({ title: 'Error', description: 'Select or add a patient', variant: 'destructive' })
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId || null,
          patientName: newPatientName || null,
          patientPhone: newPatientPhone || null,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            inventoryItemId: item.inventoryItemId
          })),
          tax: totalTax,
          discount: totalDiscount,
          offerId: selectedOfferId || null,
          paymentMethod,
          paymentStatus,
          notes
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ title: 'Success', description: `Bill ${data.bill.billNumber} saved successfully` })
        fetchInventory()
        handlePrintBill(data.bill.id)
        clearBill()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save bill', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // Print bill
  const handlePrintBill = async (billId: string) => {
    const printWindow = window.open(`/api/pdf?billId=${billId}`, '_blank')
    if (printWindow) {
      printWindow.focus()
    }
  }

  const handlePrint = () => {
    if (items.length === 0) {
      toast({ title: 'Error', description: 'No items to print', variant: 'destructive' })
      return
    }
    toast({ title: 'Tip', description: 'Save the bill first to print' })
  }

  // Filter items
  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(itemSearch.toLowerCase()))
  )

  // Filter patients
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (patient.phone && patient.phone.includes(patientSearch))
  )

  // Low stock items
  const lowStockItems = inventory.filter(item => item.stockQuantity <= 10)

  // Active offers
  const activeOffers = offers.filter(o => o.active)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-muted-foreground">Create and manage patient bills</p>
          </div>
          <div className="flex gap-2">
            <Link href="/billing/history">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
            <Button variant="outline" onClick={clearBill}>
              <FileText className="h-4 w-4 mr-2" />
              New Bill
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-border bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Low Stock Alert:</span>
                <div className="flex gap-2 flex-wrap">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <Badge key={item.id} variant="secondary">
                      {item.name} ({item.stockQuantity})
                    </Badge>
                  ))}
                  {lowStockItems.length > 5 && (
                    <Badge variant="secondary">+{lowStockItems.length - 5} more</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatientId ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {patients.find(p => p.id === selectedPatientId)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {patients.find(p => p.id === selectedPatientId)?.phone || 'No phone'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatientId('')}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowPatientDialog(true)}>
                      <User className="h-4 w-4 mr-2" />
                      Select Patient
                    </Button>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <Input
                        placeholder="New patient name"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                      />
                      <Input
                        placeholder="Phone number"
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Bill Items ({items.length})</CardTitle>
                  <Button size="sm" onClick={() => setShowItemDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No items added yet</p>
                    <p className="text-sm mt-1">Press Ctrl+A or click Add Item</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">₹{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.totalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Bill Summary & Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items ({items.length})</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Tax Section */}
                  {settings?.taxEnabled && (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>CGST ({settings.cgstPercentage}%)</span>
                        <span>₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>SGST ({settings.sgstPercentage}%)</span>
                        <span>₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Offers Section */}
                  {settings?.offersEnabled && activeOffers.length > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm">Offer</span>
                      </div>
                      <Select value={selectedOfferId} onValueChange={(val) => {
                        setSelectedOfferId(val)
                        if (val) setDiscount(0)
                      }}>
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {activeOffers.map(offer => (
                            <SelectItem key={offer.id} value={offer.id}>
                              {offer.percentage}% off
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Manual Discount */}
                  {!selectedOfferId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Discount</span>
                      <Input
                        type="number"
                        className="w-24 h-8 text-right text-sm"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                      />
                    </div>
                  )}
                  
                  {selectedOfferId && selectedOffer && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Offer ({selectedOffer.percentage}% off)</span>
                      <span>-₹{offerDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                {/* Payment Details */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Payment Status</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Notes</Label>
                    <Input
                      placeholder="Optional notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSaveBill} disabled={isSaving || items.length === 0}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save & Print Bill'}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearBill}>
                      Clear
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="bg-muted/30">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Shortcuts:</strong> Ctrl+N (New) | Ctrl+A (Add Item) | Ctrl+S (Save) | Ctrl+P (Print)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Item to Bill</DialogTitle>
            <DialogDescription>
              Search and select items from inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={itemSearchRef}
                placeholder="Search items..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-border hover:bg-muted cursor-pointer"
                    onClick={() => addItem(item)}
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.unitPrice.toFixed(2)} / {item.unit}
                      </p>
                    </div>
                    <Badge variant={item.stockQuantity > 10 ? 'default' : 'destructive'}>
                      {item.stockQuantity}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Patient Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Patient</DialogTitle>
            <DialogDescription>
              Search existing patients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 border border-border hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedPatientId(patient.id)
                      setShowPatientDialog(false)
                      setPatientSearch('')
                    }}
                  >
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.phone || 'No phone'}</p>
                    </div>
                    <Button variant="ghost" size="sm">Select</Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
