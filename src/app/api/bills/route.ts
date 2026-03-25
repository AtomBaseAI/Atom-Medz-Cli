import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate bill number
async function generateBillNumber() {
  const today = new Date()
  const prefix = `BILL-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  
  const lastBill = await db.bill.findFirst({
    where: { billNumber: { startsWith: prefix } },
    orderBy: { billNumber: 'desc' }
  })
  
  let sequence = 1
  if (lastBill) {
    const lastSequence = parseInt(lastBill.billNumber.split('-').pop() || '0')
    sequence = lastSequence + 1
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where = {
      AND: [
        search ? {
          OR: [
            { billNumber: { contains: search } },
            { patient: { name: { contains: search } } }
          ]
        } : {},
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate + 'T23:59:59') } } : {}
      ]
    }
    
    const [bills, total] = await Promise.all([
      db.bill.findMany({
        where,
        include: {
          patient: true,
          items: {
            include: {
              inventoryItem: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.bill.count({ where })
    ])
    
    return NextResponse.json({ 
      bills, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Fetch bills error:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate patient exists or create new
    let patientId = data.patientId
    if (!patientId && data.patientName) {
      const patient = await db.patient.create({
        data: { name: data.patientName, phone: data.patientPhone || null }
      })
      patientId = patient.id
    }
    
    const billNumber = await generateBillNumber()
    
    // Calculate totals
    let subtotal = 0
    const items = data.items.map((item: { name: string; quantity: number; unitPrice: number; inventoryItemId?: string }) => {
      const totalPrice = item.quantity * item.unitPrice
      subtotal += totalPrice
      return {
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        inventoryItemId: item.inventoryItemId || null
      }
    })
    
    const tax = data.tax || 0
    const discount = data.discount || 0
    const total = subtotal + tax - discount
    
    const bill = await db.bill.create({
      data: {
        billNumber,
        patientId,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: data.paymentMethod || 'cash',
        paymentStatus: data.paymentStatus || 'paid',
        notes: data.notes || null,
        items: {
          create: items
        }
      },
      include: {
        patient: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    })
    
    // Update inventory stock
    for (const item of data.items) {
      if (item.inventoryItemId) {
        await db.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
      }
    }
    
    return NextResponse.json({ bill })
  } catch (error) {
    console.error('Create bill error:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}
