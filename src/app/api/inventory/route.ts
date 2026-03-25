import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    
    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { category: { contains: search } },
            { description: { contains: search } }
          ]
        } : {},
        lowStock ? { stockQuantity: { lte: db.inventoryItem.fields.minStockLevel } } : {}
      ]
    }
    
    const items = await db.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Fetch inventory error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const item = await db.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category || null,
        description: data.description || null,
        unit: data.unit || 'piece',
        unitPrice: parseFloat(data.unitPrice),
        stockQuantity: parseInt(data.stockQuantity) || 0,
        minStockLevel: parseInt(data.minStockLevel) || 10,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        batchNumber: data.batchNumber || null
      }
    })
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Create inventory error:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
