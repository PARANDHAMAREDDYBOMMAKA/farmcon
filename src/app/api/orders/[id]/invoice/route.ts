import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order with full details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey (
          full_name,
          business_name,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          gst_number
        ),
        customer:profiles!orders_customer_id_fkey (
          full_name,
          email,
          phone,
          address,
          city,
          state,
          pincode
        ),
        items:order_items (
          *,
          product:products (
            name,
            unit
          ),
          crop_listing:crop_listings (
            unit,
            crop:crops (
              name
            )
          ),
          equipment:equipment (
            name
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order)

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

function generateInvoiceHTML(order: any) {
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN')
  const invoiceNumber = `INV-${order.id.slice(-8).toUpperCase()}`
  
  // Calculate totals
  let subtotal = 0
  const itemsHTML = order.items.map((item: any) => {
    const itemName = item.product?.name || item.crop_listing?.crop?.name || item.equipment?.name || 'Unknown Item'
    const unit = item.product?.unit || item.crop_listing?.unit || 'unit'
    const itemTotal = item.total_price
    subtotal += itemTotal
    
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.unit_price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  // Calculate taxes (assuming 18% GST for agricultural products)
  const gstRate = 0.18
  const gstAmount = subtotal * gstRate
  const totalAmount = subtotal + gstAmount

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #10b981; 
                padding-bottom: 20px; 
            }
            .company-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: #10b981; 
                margin: 0; 
            }
            .invoice-details { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
            }
            .address-section { 
                width: 48%; 
            }
            .address-title { 
                font-weight: bold; 
                color: #10b981; 
                margin-bottom: 10px; 
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
            }
            th { 
                background-color: #10b981; 
                color: white; 
                padding: 12px 8px; 
                text-align: left; 
            }
            .total-section { 
                margin-top: 20px; 
                text-align: right; 
            }
            .total-row { 
                margin: 5px 0; 
            }
            .grand-total { 
                font-size: 18px; 
                font-weight: bold; 
                color: #10b981; 
                border-top: 2px solid #10b981; 
                padding-top: 10px; 
                margin-top: 10px; 
            }
            .footer { 
                margin-top: 40px; 
                text-align: center; 
                color: #666; 
                border-top: 1px solid #e5e7eb; 
                padding-top: 20px; 
            }
            @media print {
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="company-name">FarmCon</h1>
            <p>Fresh Farm Products Direct from Farmers</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
                <h2>INVOICE</h2>
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${invoiceDate}</p>
                <p><strong>Order ID:</strong> ${order.id}</p>
            </div>
            <div style="text-align: right;">
                <p><strong>Payment Status:</strong> <span style="color: ${order.payment_status === 'paid' ? '#10b981' : '#f59e0b'}">${order.payment_status.toUpperCase()}</span></p>
                <p><strong>Order Status:</strong> <span style="color: ${order.status === 'delivered' ? '#10b981' : '#3b82f6'}">${order.status.toUpperCase()}</span></p>
                <p><strong>Payment Method:</strong> ${order.payment_method?.toUpperCase() || 'Not Specified'}</p>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div class="address-section">
                <div class="address-title">Bill To:</div>
                <p><strong>${order.customer.full_name}</strong></p>
                <p>${order.customer.email}</p>
                ${order.customer.phone ? `<p>Phone: ${order.customer.phone}</p>` : ''}
                ${order.customer.address ? `
                    <p>${order.customer.address}</p>
                    <p>${order.customer.city}${order.customer.state ? `, ${order.customer.state}` : ''} ${order.customer.pincode || ''}</p>
                ` : ''}
            </div>
            <div class="address-section">
                <div class="address-title">Sold By:</div>
                <p><strong>${order.seller.business_name || order.seller.full_name}</strong></p>
                <p>${order.seller.email}</p>
                ${order.seller.phone ? `<p>Phone: ${order.seller.phone}</p>` : ''}
                ${order.seller.address ? `
                    <p>${order.seller.address}</p>
                    <p>${order.seller.city}${order.seller.state ? `, ${order.seller.state}` : ''} ${order.seller.pincode || ''}</p>
                ` : ''}
                ${order.seller.gst_number ? `<p><strong>GST No:</strong> ${order.seller.gst_number}</p>` : ''}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Rate</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <strong>Subtotal: ₹${subtotal.toFixed(2)}</strong>
            </div>
            <div class="total-row">
                GST (18%): ₹${gstAmount.toFixed(2)}
            </div>
            <div class="total-row grand-total">
                <strong>Total Amount: ₹${totalAmount.toFixed(2)}</strong>
            </div>
        </div>

        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a computer-generated invoice and requires no signature.</p>
            <p>For any queries, please contact us at support@farmcon.com</p>
            <br>
            <button class="no-print" onclick="window.print()" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                Print Invoice
            </button>
        </div>
    </body>
    </html>
  `
}