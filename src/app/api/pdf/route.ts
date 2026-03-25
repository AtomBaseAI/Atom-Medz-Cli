import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const billId = searchParams.get('billId')
    
    if (!billId) {
      return NextResponse.json({ error: 'Bill ID required' }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    
    const user = await db.user.findUnique({
      where: { id: sessionId },
      select: { name: true, clinicName: true, clinicAddress: true, clinicPhone: true }
    })
    
    const bill = await db.bill.findUnique({
      where: { id: billId },
      include: {
        patient: true,
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    })
    
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }
    
    // Generate HTML for PDF
    const html = generateBillHTML(bill, user)
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateBillHTML(bill: any, user: any) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill #${bill.billNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1a1a1a;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #22c55e;
    }
    .clinic-name {
      font-size: 28px;
      font-weight: bold;
      color: #16a34a;
      margin-bottom: 5px;
    }
    .clinic-info {
      color: #666;
      font-size: 14px;
    }
    .bill-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }
    .bill-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .bill-info-section {
      flex: 1;
    }
    .bill-info-section h3 {
      font-size: 14px;
      color: #888;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .bill-info-section p {
      font-size: 16px;
      margin-bottom: 3px;
    }
    .patient-info {
      background: #f8faf8;
      padding: 15px;
      margin-bottom: 20px;
      border-left: 4px solid #22c55e;
    }
    .patient-info h3 {
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #16a34a;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
    }
    tr:nth-child(even) {
      background: #f9faf9;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .totals-row.total {
      font-size: 20px;
      font-weight: bold;
      color: #16a34a;
      border-bottom: 2px solid #16a34a;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    .payment-info {
      background: #f0fdf4;
      padding: 15px;
      margin-top: 20px;
      border: 1px solid #22c55e;
    }
    .payment-info p {
      margin: 5px 0;
    }
    .status-paid {
      color: #16a34a;
      font-weight: bold;
    }
    .status-pending {
      color: #f59e0b;
      font-weight: bold;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">${user?.clinicName || user?.name || 'Medical Clinic'}</div>
    <div class="clinic-info">
      ${user?.clinicAddress ? `<p>${user.clinicAddress}</p>` : ''}
      ${user?.clinicPhone ? `<p>Phone: ${user.clinicPhone}</p>` : ''}
    </div>
  </div>
  
  <h1 class="bill-title">INVOICE</h1>
  
  <div class="bill-info">
    <div class="bill-info-section">
      <h3>Bill Number</h3>
      <p><strong>${bill.billNumber}</strong></p>
    </div>
    <div class="bill-info-section">
      <h3>Date</h3>
      <p>${formatDate(bill.createdAt)}</p>
    </div>
  </div>
  
  <div class="patient-info">
    <h3>Bill To</h3>
    <p><strong>${bill.patient.name}</strong></p>
    ${bill.patient.phone ? `<p>Phone: ${bill.patient.phone}</p>` : ''}
    ${bill.patient.address ? `<p>Address: ${bill.patient.address}</p>` : ''}
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${bill.items.map((item: any) => `
        <tr>
          <td>${item.itemName}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(bill.subtotal)}</span>
    </div>
    ${bill.tax > 0 ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>${formatCurrency(bill.tax)}</span>
      </div>
    ` : ''}
    ${bill.discount > 0 ? `
      <div class="totals-row">
        <span>Discount:</span>
        <span>-${formatCurrency(bill.discount)}</span>
      </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total:</span>
      <span>${formatCurrency(bill.total)}</span>
    </div>
  </div>
  
  <div class="payment-info">
    <p><strong>Payment Method:</strong> ${bill.paymentMethod?.toUpperCase() || 'CASH'}</p>
    <p><strong>Payment Status:</strong> 
      <span class="${bill.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
        ${bill.paymentStatus?.toUpperCase() || 'PAID'}
      </span>
    </p>
    ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}
  </div>
  
  <div class="footer">
    <p>Thank you for your visit!</p>
    <p>This is a computer-generated invoice.</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
`
}
