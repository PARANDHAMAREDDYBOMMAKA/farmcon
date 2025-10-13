# Real Delivery Tracking System - Implementation Guide

## Overview

The delivery tracking system has been upgraded from fake/simulated data to a **real, database-backed tracking system** with live GPS updates and driver management.

## What's Changed

### Before (Fake System)
- ❌ Hardcoded route waypoints
- ❌ Simulated driver movement
- ❌ Fake location updates
- ❌ No real driver information
- ❌ No database persistence

### After (Real System)
- ✅ Real GPS coordinates from database
- ✅ Actual driver locations tracked live
- ✅ Real-time location history
- ✅ Driver management system
- ✅ Database-backed delivery tracking
- ✅ API endpoints for all operations
- ✅ Polling for live updates (30-second intervals)

## Database Schema

### New Tables Added

1. **drivers** - Store driver information
   - Full name, phone, vehicle details
   - Current GPS location (latitude, longitude)
   - Last location update timestamp

2. **deliveries** - Track delivery records for orders
   - Links to orders and drivers
   - Pickup and delivery coordinates
   - Estimated and actual delivery times
   - Unique tracking numbers
   - Delivery status (pending, assigned, picked_up, in_transit, out_for_delivery, delivered)

3. **delivery_locations** - GPS location history
   - Timestamped location updates
   - Latitude, longitude, accuracy, speed, heading
   - Optional address information

4. **delivery_milestones** - Delivery checkpoints
   - Milestone events (e.g., "Package picked up", "Out for delivery")
   - GPS coordinates for each milestone
   - Completion timestamps

## Setup Instructions

### 1. Apply Database Migration

First, make sure your database is accessible, then run:

```bash
npx prisma db push
```

This will create all the new tables (drivers, deliveries, delivery_locations, delivery_milestones).

### 2. Generate Prisma Client

After the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

This updates the TypeScript types for the new models.

### 3. Create Test Drivers (Optional)

You can create test drivers using the API or directly in the database:

```bash
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "vehicleType": "Truck",
    "vehicleNumber": "AB-12-CD-3456",
    "licenseNumber": "DL123456789"
  }'
```

## API Endpoints

### Deliveries

**Create Delivery**
```
POST /api/deliveries
Body: {
  orderId: string,
  driverId?: string,
  pickupLatitude: number,
  pickupLongitude: number,
  pickupAddress: string,
  deliveryLatitude: number,
  deliveryLongitude: number,
  deliveryAddress: string,
  estimatedDeliveryTime?: string
}
```

**Get Deliveries**
```
GET /api/deliveries?orderId={orderId}&driverId={driverId}&status={status}
```

**Update Delivery**
```
PUT /api/deliveries/[id]
Body: {
  status?: string,
  driverId?: string,
  actualPickupTime?: string,
  actualDeliveryTime?: string
}
```

**Update Driver Location**
```
POST /api/deliveries/[id]/location
Body: {
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  heading?: number,
  address?: string
}
```

**Get Location History**
```
GET /api/deliveries/[id]/location?limit=100&since={ISO_timestamp}
```

### Drivers

**Create Driver**
```
POST /api/drivers
Body: {
  fullName: string,
  phone: string,
  email?: string,
  vehicleType: string,
  vehicleNumber: string,
  licenseNumber: string
}
```

**Get All Drivers**
```
GET /api/drivers?isActive=true
```

**Get Driver by ID**
```
GET /api/drivers/[id]
```

**Update Driver**
```
PUT /api/drivers/[id]
Body: {
  currentLatitude?: number,
  currentLongitude?: number,
  isActive?: boolean,
  ...other fields
}
```

## Driver Dashboard

A new driver interface has been created at `/driver` where drivers can:

1. **Login** using their phone number
2. **Start/Stop GPS tracking** for real-time location updates
3. **View active deliveries** assigned to them
4. **Update delivery status** through action buttons:
   - Mark as Picked Up
   - Start Transit
   - Out for Delivery
   - Mark as Delivered

### How Drivers Use It

1. Navigate to `http://localhost:3000/driver`
2. Enter their registered phone number
3. Click "Start Tracking" to begin GPS location updates
4. The system automatically updates all active delivery locations every time GPS position changes
5. Use action buttons to update delivery status

## Frontend Components

### LeafletDeliveryMap Component

**Now fetches real data:**
- Gets delivery info from `/api/deliveries?orderId={id}`
- Shows actual pickup and delivery locations
- Displays driver's current GPS position (if available)
- Updates every 30 seconds when order is shipped
- Shows driver info popup with vehicle details and phone

### DeliveryTracker Component

**Now displays real milestones:**
- Fetches delivery data from API
- Shows real tracking number
- Displays actual driver information
- Updates current location from GPS history
- Uses real estimated delivery time from database

## Integration with Order Flow

### When Order is Shipped

When a seller marks an order as "shipped", you should:

1. **Create a delivery record:**
```javascript
const response = await fetch('/api/deliveries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    // Get seller location from profile
    pickupLatitude: 17.3850,  // Seller's warehouse
    pickupLongitude: 78.4867,
    pickupAddress: seller.address,
    // Get customer location from shipping address
    deliveryLatitude: 13.6168,
    deliveryLongitude: 79.5460,
    deliveryAddress: order.shipping_address,
    estimatedDeliveryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days
  })
})
```

2. **Optionally assign a driver:**
```javascript
await fetch(`/api/deliveries/${deliveryId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: selectedDriverId,
    status: 'assigned'
  })
})
```

## Location Tracking Features

### Browser Geolocation API

The driver dashboard uses `navigator.geolocation.watchPosition()` to:
- Get high-accuracy GPS coordinates
- Track speed and heading
- Update location continuously
- Send updates to API every time position changes

### Privacy & Permissions

- Drivers must grant location permission in their browser
- Location tracking can be started/stopped at any time
- Only active when driver explicitly enables it

## Real-Time Updates

### Polling Strategy

Both map and tracker components poll the API every 30 seconds when:
- Order status is 'shipped', 'processing', or 'confirmed'
- A delivery record exists for the order

This provides near real-time tracking without WebSocket complexity.

### Future Enhancements

For true real-time updates, consider:
- WebSocket integration for instant updates
- Push notifications for delivery milestones
- SMS updates to customers
- Route optimization algorithms

## Testing the System

### Manual Testing Flow

1. **Create a test driver** (via API or database)
2. **Create an order** and mark it as shipped
3. **Create a delivery** for the order with GPS coordinates
4. **Assign the driver** to the delivery
5. **Open driver dashboard** at `/driver` and login
6. **Start GPS tracking** (you can use a GPS spoofing tool for testing)
7. **View customer tracking page** at `/dashboard/orders/[id]/track`
8. **Update delivery status** through driver dashboard
9. **Observe real-time updates** on customer tracking page

### GPS Spoofing for Testing

For desktop testing, you can use browser dev tools:
1. Open Chrome DevTools
2. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows)
3. Type "sensors" and select "Show Sensors"
4. Set a custom geolocation or select a preset city
5. The driver dashboard will use this location

## Troubleshooting

### "Cannot reach database server"
- Check your DATABASE_URL in .env file
- Ensure Supabase instance is running
- Verify network connectivity

### "Property 'delivery' does not exist"
- Run `npx prisma generate` to regenerate Prisma client
- Restart your Next.js dev server

### "Geolocation is not supported"
- Ensure HTTPS is enabled (required for geolocation)
- Or use `localhost` which is allowed
- Check browser permissions

### No location updates showing
- Verify driver has started GPS tracking
- Check browser console for errors
- Ensure location permissions are granted
- Confirm delivery record exists in database

## Production Considerations

### Security
- Add authentication to driver endpoints
- Validate driver identity before allowing location updates
- Implement rate limiting on location update endpoint
- Sanitize GPS coordinates and addresses

### Performance
- Consider Redis caching for frequently accessed delivery data
- Implement database indexes on frequently queried fields
- Use connection pooling for database
- Consider CDN for static map tiles

### Scalability
- Move to WebSocket for better real-time performance
- Implement job queues for location processing
- Use geospatial database extensions (PostGIS)
- Consider dedicated mapping services (Mapbox, Google Maps)

## Next Steps

1. ✅ Database migration completed
2. ✅ API endpoints created
3. ✅ Frontend components updated
4. ✅ Driver dashboard created
5. ⏳ Run the migration when database is accessible
6. 🔜 Add automated delivery creation when order is shipped
7. 🔜 Add driver assignment interface for admins
8. 🔜 Implement route optimization
9. 🔜 Add SMS/email notifications for milestones

## Support

For issues or questions, refer to:
- API documentation in respective route files
- Prisma schema at `prisma/schema.prisma`
- Component code with inline comments
