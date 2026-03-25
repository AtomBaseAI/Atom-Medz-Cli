import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventoryItem.findUnique({
      where: { id }
    })
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const item = await db.inventoryItem.update({
      where: { id },
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
    console.error('Update item error:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.inventoryItem.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
