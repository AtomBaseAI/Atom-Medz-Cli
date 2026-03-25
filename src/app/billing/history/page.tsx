'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Printer, 
  Search,
  Calendar,
  FileText
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Bill {
  id: string
  billNumber: string
  patient: { name: string; phone?: string | null }
  items: { itemName: string; quantity: number; unitPrice: number; totalPrice: number }[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

export default function BillingHistoryPage() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/bills?limit=100')
      const data = await res.json()
      setBills(data.bills || [])
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintBill = async (billId: string) => {
    const printWindow = window.open(`/api/pdf?billId=${billId}`, '_blank')
    if (printWindow) {
      printWindow.focus()
    }
  }

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      bill.patient.name.toLowerCase().includes(search.toLowerCase())
    
    const matchesPayment = paymentFilter === 'all' || bill.paymentStatus === paymentFilter
    
    const matchesDate = !dateFilter || 
      new Date(bill.createdAt).toISOString().split('T')[0] === dateFilter
    
    return matchesSearch && matchesPayment && matchesDate
  })

  // Stats
  const totalRevenue = filteredBills.reduce((sum, b) => sum + b.total, 0)
  const paidBills = filteredBills.filter(b => b.paymentStatus === 'paid').length
  const pendingBills = filteredBills.filter(b => b.paymentStatus === 'pending').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/billing')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Billing History</h1>
              <p className="text-muted-foreground">View and manage all bills</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Bills</span>
              </div>
              <p className="text-2xl font-bold mt-2">{filteredBills.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-2">₹{totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Paid</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-600">{paidBills}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-600">{pendingBills}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bill number or patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 w-full md:w-48"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-420px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No bills found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>
                          {new Date(bill.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{bill.patient.name}</p>
                            {bill.patient.phone && (
                              <p className="text-xs text-muted-foreground">{bill.patient.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">₹{bill.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{bill.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{bill.discount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">₹{bill.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={bill.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {bill.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintBill(bill.id)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
