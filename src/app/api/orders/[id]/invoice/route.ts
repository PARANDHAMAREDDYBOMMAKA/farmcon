import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: {
            fullName: true,
            businessName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            gstNumber: true
          }
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            pincode: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true
              }
            },
            cropListing: {
              include: {
                crop: {
                  select: {
                    name: true
                  }
                }
              }
            },
            equipment: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format')

    if (format === 'pdf') {
      
      const invoiceHTML = generateInvoiceHTML(order, true)
      return new NextResponse(invoiceHTML, {
        headers: {
          'Content-Type': 'text/html',
        }
      })
    }

    const invoiceHTML = generateInvoiceHTML(order, false)

    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${orderId}.html"`
      }
    })

  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}

function generateInvoiceHTML(order: any, forPDF: boolean = false) {
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const invoiceNumber = `INV-${order.id.slice(-8).toUpperCase()}`

  // Calculate totals - the totalPrice already includes GST from cart
  // So we need to reverse-calculate the base price and GST
  const gstRate = 0.18
  let totalAmount = 0

  const itemsHTML = order.items.map((item: any) => {
    const itemName = item.product?.name || item.cropListing?.crop?.name || item.equipment?.name || 'Unknown Item'
    const unit = item.product?.unit || item.cropListing?.unit || 'unit'
    const itemTotal = Number(item.totalPrice) // This includes GST
    totalAmount += itemTotal

    // Reverse calculate base price from total (total = base + base*0.18 = base*1.18)
    const basePrice = itemTotal / (1 + gstRate)
    const unitBasePrice = Number(item.unitPrice) / (1 + gstRate)

    return `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${itemName}</td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${Number(item.quantity)} ${unit}</td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">₹${unitBasePrice.toFixed(2)}</td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600;">₹${basePrice.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  // Calculate subtotal (without GST) and GST amount
  const subtotal = totalAmount / (1 + gstRate)
  const gstAmount = totalAmount - subtotal

  const pdfScript = forPDF ? `
    <script src="https:
    <script>
      window.onload = function() {
        const element = document.body;
        const opt = {
          margin: 10,
          filename: 'invoice-${invoiceNumber}.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
      };
    </script>
  ` : ''

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                padding: 40px 20px;
            }
            .invoice-container {
                max-width: 900px;
                margin: 0 auto;
                background: #ffffff;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                border-radius: 20px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                padding: 40px 50px;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -10%;
                width: 300px;
                height: 300px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
            }
            .header-content {
                position: relative;
                z-index: 1;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .company-info h1 {
                font-size: 36px;
                font-weight: 800;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
            }
            .company-info p {
                font-size: 15px;
                opacity: 0.95;
                font-weight: 500;
            }
            .invoice-badge {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                padding: 12px 24px;
                border-radius: 50px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                text-align: right;
            }
            .invoice-badge h2 {
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
            }
            .invoice-badge .invoice-number {
                font-size: 24px;
                font-weight: 800;
            }
            .content-section {
                padding: 50px;
            }
            .invoice-meta {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 40px;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 2px solid #e5e7eb;
            }
            .meta-group h3 {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #059669;
                font-weight: 700;
                margin-bottom: 12px;
            }
            .meta-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 14px;
            }
            .meta-label {
                color: #6b7280;
                font-weight: 500;
            }
            .meta-value {
                color: #111827;
                font-weight: 600;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 50px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status-paid {
                background: #d1fae5;
                color: #065f46;
            }
            .status-pending {
                background: #fed7aa;
                color: #92400e;
            }
            .status-delivered {
                background: #d1fae5;
                color: #065f46;
            }
            .status-processing {
                background: #bfdbfe;
                color: #1e40af;
            }
            .parties-section {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 40px;
                margin-bottom: 40px;
            }
            .party-box {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
            }
            .party-title {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #059669;
                font-weight: 700;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .party-title::before {
                content: '';
                width: 4px;
                height: 16px;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                border-radius: 2px;
            }
            .party-name {
                font-size: 18px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 8px;
            }
            .party-detail {
                font-size: 14px;
                color: #6b7280;
                margin: 4px 0;
                line-height: 1.6;
            }
            .items-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 30px 0;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                overflow: hidden;
            }
            .items-table thead tr {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            }
            .items-table th {
                color: white;
                font-weight: 700;
                padding: 16px 12px;
                text-align: left;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .items-table th:nth-child(2) {
                text-align: center;
            }
            .items-table th:nth-child(3),
            .items-table th:nth-child(4) {
                text-align: right;
            }
            .items-table tbody tr {
                transition: background-color 0.2s ease;
            }
            .items-table tbody tr:hover {
                background-color: #f9fafb;
            }
            .items-table tbody tr:last-child td {
                border-bottom: none;
            }
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 30px;
            }
            .totals-box {
                min-width: 400px;
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                font-size: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            .total-row:last-child {
                border-bottom: none;
            }
            .total-label {
                color: #6b7280;
                font-weight: 600;
            }
            .total-value {
                color: #111827;
                font-weight: 700;
            }
            .grand-total-row {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                margin: 16px -24px -24px;
                padding: 20px 24px;
                border-radius: 0 0 12px 12px;
            }
            .grand-total-row .total-label,
            .grand-total-row .total-value {
                color: white;
                font-size: 20px;
                font-weight: 800;
            }
            .notes-section {
                background: #fffbeb;
                border: 2px solid #fcd34d;
                border-radius: 12px;
                padding: 20px;
                margin: 30px 0;
            }
            .notes-title {
                font-size: 14px;
                font-weight: 700;
                color: #92400e;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .notes-content {
                font-size: 14px;
                color: #78350f;
                line-height: 1.6;
            }
            .footer-section {
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                padding: 40px 50px;
                text-align: center;
                border-top: 3px solid #10b981;
            }
            .footer-title {
                font-size: 20px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 12px;
            }
            .footer-text {
                font-size: 14px;
                color: #6b7280;
                margin: 8px 0;
                line-height: 1.8;
            }
            .footer-contact {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #d1d5db;
                font-size: 13px;
                color: #6b7280;
            }
            .action-buttons {
                margin-top: 30px;
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            .btn {
                padding: 14px 32px;
                border: none;
                border-radius: 50px;
                font-weight: 700;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }
            .btn-primary {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
            }
            .btn-secondary {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
            }
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .invoice-container {
                    box-shadow: none;
                    border-radius: 0;
                }
                .no-print {
                    display: none;
                }
            }
            @media (max-width: 768px) {
                .content-section {
                    padding: 30px 20px;
                }
                .invoice-meta,
                .parties-section {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                .totals-box {
                    min-width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="company-info">
                        <h1>🌾 FarmCon</h1>
                        <p>Smart Farming Platform - Farm Fresh Direct</p>
                    </div>
                    <div class="invoice-badge">
                        <h2>Invoice</h2>
                        <div class="invoice-number">${invoiceNumber}</div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="content-section">
                <!-- Invoice Meta Information -->
                <div class="invoice-meta">
                    <div class="meta-group">
                        <h3>Invoice Details</h3>
                        <div class="meta-item">
                            <span class="meta-label">Invoice Date:</span>
                            <span class="meta-value">${invoiceDate}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Order ID:</span>
                            <span class="meta-value">#${order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Payment Method:</span>
                            <span class="meta-value">${order.paymentMethod?.toUpperCase() || 'Not Specified'}</span>
                        </div>
                    </div>
                    <div class="meta-group">
                        <h3>Status Information</h3>
                        <div class="meta-item">
                            <span class="meta-label">Payment Status:</span>
                            <span class="status-badge ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">${order.paymentStatus}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Order Status:</span>
                            <span class="status-badge ${order.status === 'delivered' ? 'status-delivered' : 'status-processing'}">${order.status}</span>
                        </div>
                    </div>
                </div>

                <!-- Parties Information -->
                <div class="parties-section">
                    <div class="party-box">
                        <div class="party-title">Bill To</div>
                        <div class="party-name">${order.customer.fullName}</div>
                        <div class="party-detail">📧 ${order.customer.email}</div>
                        ${order.customer.phone ? `<div class="party-detail">📞 ${order.customer.phone}</div>` : ''}
                        ${order.customer.address ? `
                            <div class="party-detail" style="margin-top: 12px;">📍 ${order.customer.address}</div>
                            <div class="party-detail">${order.customer.city}${order.customer.state ? `, ${order.customer.state}` : ''} ${order.customer.pincode || ''}</div>
                        ` : ''}
                    </div>
                    <div class="party-box">
                        <div class="party-title">Sold By</div>
                        <div class="party-name">${order.seller.businessName || order.seller.fullName}</div>
                        <div class="party-detail">📧 ${order.seller.email}</div>
                        ${order.seller.phone ? `<div class="party-detail">📞 ${order.seller.phone}</div>` : ''}
                        ${order.seller.gstNumber ? `<div class="party-detail" style="margin-top: 8px;"><strong>GST:</strong> ${order.seller.gstNumber}</div>` : ''}
                        ${order.seller.address ? `
                            <div class="party-detail" style="margin-top: 12px;">📍 ${order.seller.address}</div>
                            <div class="party-detail">${order.seller.city}${order.seller.state ? `, ${order.seller.state}` : ''} ${order.seller.pincode || ''}</div>
                        ` : ''}
                    </div>
                </div>

                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Quantity</th>
                            <th>Rate (Excl. GST)</th>
                            <th>Amount (Excl. GST)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <!-- Totals -->
                <div class="totals-section">
                    <div class="totals-box">
                        <div class="total-row">
                            <span class="total-label">Subtotal (Excl. GST):</span>
                            <span class="total-value">₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span class="total-label">GST (18%):</span>
                            <span class="total-value">₹${gstAmount.toFixed(2)}</span>
                        </div>
                        <div class="grand-total-row">
                            <div class="total-row">
                                <span class="total-label">Total Amount:</span>
                                <span class="total-value">₹${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div class="notes-section">
                    <div class="notes-title">📝 Important Notes</div>
                    <div class="notes-content">
                        • This is a computer-generated invoice and does not require a physical signature.<br>
                        • All amounts are in Indian Rupees (₹).<br>
                        • GST of 18% is included as per applicable regulations.<br>
                        • For any queries regarding this invoice, please contact our support team.
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer-section">
                <div class="footer-title">Thank You for Your Business! 🙏</div>
                <p class="footer-text">
                    We appreciate your trust in FarmCon. Your order helps support local farmers<br>
                    and promotes sustainable agriculture across India.
                </p>
                <div class="footer-contact">
                    <strong>Support:</strong> support@farmcon.in | <strong>Phone:</strong> +91 1800-XXX-XXXX (Toll Free)<br>
                    <strong>Address:</strong> FarmCon Technologies Pvt. Ltd., Bangalore, Karnataka, India
                </div>
                ${!forPDF ? `
                <div class="action-buttons no-print">
                    <button class="btn btn-primary" onclick="window.print()">
                        🖨️ Print Invoice
                    </button>
                    <button class="btn btn-secondary" onclick="downloadPDF()">
                        📄 Download PDF
                    </button>
                </div>
                <script>
                    function downloadPDF() {
                        window.location.href = window.location.pathname + '?format=pdf';
                    }
                </script>
                ` : ''}
            </div>
        </div>
        ${pdfScript}
    </body>
    </html>
  `
}