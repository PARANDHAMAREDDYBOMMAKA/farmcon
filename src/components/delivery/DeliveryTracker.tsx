'use client'

import { useState, useEffect } from 'react'
import { format, addDays, parseISO, differenceInHours, isAfter } from 'date-fns'

interface DeliveryTrackerProps {
  order: {
    id: string
    status: string
    created_at: string
    payment_method: string
    shipping_address: any
    total_amount: number
  }
  onStatusUpdate?: (status: string) => void
}

interface DeliveryMilestone {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
  timestamp?: string
  icon: string
  estimatedTime?: string
}

export default function DeliveryTracker({ order, onStatusUpdate }: DeliveryTrackerProps) {
  const [milestones, setMilestones] = useState<DeliveryMilestone[]>([])
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string>('')

  useEffect(() => {
    generateMilestones()
    calculateETA()
    simulateDeliveryProgress()
  }, [order.status])

  const generateMilestones = () => {
    const orderDate = parseISO(order.created_at)

    const milestoneData: DeliveryMilestone[] = [
      {
        id: 'order_placed',
        title: 'Order Placed',
        description: 'Your order has been successfully placed',
        status: 'completed',
        timestamp: order.created_at,
        icon: '🛍️'
      },
      {
        id: 'payment_confirmed',
        title: 'Payment Confirmed',
        description: `Payment via ${order.payment_method} confirmed`,
        status: 'completed',
        timestamp: order.created_at,
        icon: '💳'
      },
      {
        id: 'order_confirmed',
        title: 'Order Confirmed',
        description: 'Seller confirmed your order',
        status: order.status === 'pending' ? 'current' : 'completed',
        timestamp: order.status !== 'pending' ? format(addDays(orderDate, 0), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '✅',
        estimatedTime: order.status === 'pending' ? 'Within 2 hours' : undefined
      },
      {
        id: 'preparing',
        title: 'Preparing for Dispatch',
        description: 'Your order is being prepared at our Hyderabad warehouse',
        status: order.status === 'confirmed' ? 'current' :
               ['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        timestamp: ['processing', 'shipped', 'delivered'].includes(order.status) ?
                  format(addDays(orderDate, 1), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '📦',
        estimatedTime: order.status === 'confirmed' ? 'Within 24 hours' : undefined
      },
      {
        id: 'dispatched',
        title: 'Dispatched',
        description: 'Your order has left our Hyderabad facility',
        status: order.status === 'processing' ? 'current' :
               ['shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        timestamp: ['shipped', 'delivered'].includes(order.status) ?
                  format(addDays(orderDate, 2), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '🚛',
        estimatedTime: order.status === 'processing' ? 'Within 12 hours' : undefined
      },
      {
        id: 'in_transit',
        title: 'In Transit',
        description: 'Your order is on the way to your location',
        status: order.status === 'shipped' ? 'current' :
               order.status === 'delivered' ? 'completed' : 'pending',
        timestamp: order.status === 'delivered' ?
                  format(addDays(orderDate, 3), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '🚚',
        estimatedTime: order.status === 'shipped' ? '2-3 days' : undefined
      },
      {
        id: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is out for delivery in your area',
        status: order.status === 'delivered' ? 'completed' : 'pending',
        timestamp: order.status === 'delivered' ?
                  format(addDays(orderDate, 4), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '📍',
        estimatedTime: order.status === 'shipped' ? 'Today by 8 PM' : undefined
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered successfully',
        status: order.status === 'delivered' ? 'completed' : 'pending',
        timestamp: order.status === 'delivered' ?
                  format(addDays(orderDate, 4), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
        icon: '🎉'
      }
    ]

    setMilestones(milestoneData)
  }

  const calculateETA = () => {
    const orderDate = parseISO(order.created_at)
    const deliveryDays = order.payment_method === 'cod' ? 5 : 4
    const eta = addDays(orderDate, deliveryDays)
    setEstimatedDelivery(eta)
  }

  const simulateDeliveryProgress = () => {
    if (order.status === 'shipped') {
      const locations = [
        'Left Hyderabad facility',
        'Reached sorting facility, Vijayawada',
        'In transit to Tirupati',
        'Reached Tirupati distribution center',
        'Out for delivery in Kalakada area'
      ]

      let currentIndex = 0
      setCurrentLocation(locations[0])

      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % locations.length
        setCurrentLocation(locations[currentIndex])
      }, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }
  }

  const getProgressPercentage = () => {
    const completedMilestones = milestones.filter(m => m.status === 'completed').length
    return (completedMilestones / milestones.length) * 100
  }

  const getCurrentMilestone = () => {
    return milestones.find(m => m.status === 'current')
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with Order Info */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.id.slice(-8)}</h2>
            <p className="text-green-100">Total: ₹{order.total_amount}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">Estimated Delivery</div>
            <div className="text-xl font-semibold">
              {estimatedDelivery ? format(estimatedDelivery, 'MMM dd, yyyy') : 'Calculating...'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-green-100 mb-2">
            <span>Order Progress</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <div className="w-full bg-green-200/30 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Status Banner */}
      {getCurrentMilestone() && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getCurrentMilestone()?.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {getCurrentMilestone()?.title}
              </h3>
              <p className="text-blue-700">{getCurrentMilestone()?.description}</p>
              {getCurrentMilestone()?.estimatedTime && (
                <p className="text-sm text-blue-600 font-medium">
                  ETA: {getCurrentMilestone()?.estimatedTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Location Update for Shipped Orders */}
      {order.status === 'shipped' && currentLocation && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <div className="animate-pulse text-2xl mr-3">📍</div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Live Location</h3>
              <p className="text-yellow-700">{currentLocation}</p>
              <p className="text-sm text-yellow-600">Updates every few minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Timeline */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Delivery Timeline</h3>

        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start space-x-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-all duration-300
                  ${milestone.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                    milestone.status === 'current' ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {milestone.status === 'completed' ? '✓' : milestone.icon}
                </div>
                {index < milestones.length - 1 && (
                  <div className={`
                    w-0.5 h-12 mt-2 transition-all duration-300
                    ${milestone.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}
                  `} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <h4 className={`
                    text-lg font-semibold transition-all duration-300
                    ${milestone.status === 'completed' ? 'text-gray-900' :
                      milestone.status === 'current' ? 'text-blue-600' : 'text-gray-400'}
                  `}>
                    {milestone.title}
                  </h4>
                  {milestone.timestamp && (
                    <span className="text-sm text-gray-500">
                      {format(parseISO(milestone.timestamp), 'MMM dd, h:mm a')}
                    </span>
                  )}
                </div>
                <p className={`
                  text-sm mt-1 transition-all duration-300
                  ${milestone.status === 'completed' ? 'text-gray-600' :
                    milestone.status === 'current' ? 'text-blue-600' : 'text-gray-400'}
                `}>
                  {milestone.description}
                </p>
                {milestone.estimatedTime && milestone.status === 'current' && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ⏱️ {milestone.estimatedTime}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
            📞 Contact Delivery Partner
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            📍 Track on Map
          </button>
          {order.status === 'delivered' && (
            <button className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors">
              ⭐ Rate & Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}