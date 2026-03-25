'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Download,
  Calendar,
  Users,
  Package
} from 'lucide-react'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface Bill {
  id: string
  billNumber: string
  patient: { name: string }
  total: number
  paymentStatus: string
  paymentMethod: string
  createdAt: string
}

interface DailyStats {
  date: string
  bills: number
  revenue: number
}

const chartConfig = {
  bills: {
    label: "Bills",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

export default function ReportsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBills: 0,
    averageBill: 0,
    paidBills: 0,
    pendingBills: 0,
    cashPayments: 0,
    cardPayments: 0,
    upiPayments: 0
  })

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bills?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=100`)
      const data = await res.json()
      
      const fetchedBills = data.bills || []
      setBills(fetchedBills)
      
      // Calculate stats
      const totalRevenue = fetchedBills.reduce((sum: number, b: Bill) => sum + b.total, 0)
      const totalBills = fetchedBills.length
      const averageBill = totalBills > 0 ? totalRevenue / totalBills : 0
      const paidBills = fetchedBills.filter((b: Bill) => b.paymentStatus === 'paid').length
      const pendingBills = fetchedBills.filter((b: Bill) => b.paymentStatus === 'pending').length
      const cashPayments = fetchedBills.filter((b: Bill) => b.paymentMethod === 'cash').length
      const cardPayments = fetchedBills.filter((b: Bill) => b.paymentMethod === 'card').length
      const upiPayments = fetchedBills.filter((b: Bill) => b.paymentMethod === 'upi').length
      
      setStats({
        totalRevenue,
        totalBills,
        averageBill,
        paidBills,
        pendingBills,
        cashPayments,
        cardPayments,
        upiPayments
      })
      
      // Calculate daily stats
      const dailyMap = new Map<string, { bills: number; revenue: number }>()
      fetchedBills.forEach((bill: Bill) => {
        const date = new Date(bill.createdAt).toISOString().split('T')[0]
        const existing = dailyMap.get(date) || { bills: 0, revenue: 0 }
        dailyMap.set(date, {
          bills: existing.bills + 1,
          revenue: existing.revenue + bill.total
        })
      })
      
      const dailyStatsArray = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14) // Last 14 days
      
      setDailyStats(dailyStatsArray)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const paymentMethodData = [
    { name: 'Cash', value: stats.cashPayments },
    { name: 'Card', value: stats.cardPayments },
    { name: 'UPI', value: stats.upiPayments }
  ].filter(d => d.value > 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">View billing statistics and trends</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-40"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-2">₹{stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Bills</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalBills}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Average Bill</span>
              </div>
              <p className="text-2xl font-bold mt-2">₹{stats.averageBill.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Paid / Pending</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                <span>{stats.paidBills}</span>
                <span className="text-muted-foreground"> / </span>
                <span>{stats.pendingBills}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
              <CardDescription>Last 14 days revenue trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={dailyStats}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bills Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Bills</CardTitle>
              <CardDescription>Number of bills per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={dailyStats}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bills" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No payment data
                </div>
              )}
              <div className="flex justify-center gap-4 mt-4">
                {paymentMethodData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bills */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Bills</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill No.</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.slice(0, 10).map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>{bill.patient.name}</TableCell>
                        <TableCell className="text-right">₹{bill.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={bill.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {bill.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
