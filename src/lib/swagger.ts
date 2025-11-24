import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'FarmCon API Documentation',
        version: '1.0.0',
        description: `
# FarmCon API

A comprehensive B2B/B2C marketplace platform API for Indian farmers, connecting them with suppliers, buyers, and service providers.

## Features
- 🤖 AI-Powered Chatbot & Price Predictions
- 🔐 Multi-factor Authentication (Email OTP, Phone OTP, Social Login)
- 🔔 Real-time Notifications
- 🔍 Advanced Search (MeiliSearch)
- 📦 Order Management & Tracking
- 💳 Payment Processing (Stripe)
- 🌾 Crop & Equipment Management
- 📊 Market Price Analytics
- 🌤️ Weather Integration
- 🚚 Delivery Tracking with GPS

## Authentication

Most endpoints require authentication. Include the Authorization header:

\`\`\`
Authorization: Bearer YOUR_ACCESS_TOKEN
\`\`\`

You can obtain an access token by:
1. Sending OTP: \`POST /api/auth/send-otp\`
2. Verifying OTP: \`POST /api/auth/verify-otp\`

## Rate Limiting

API requests are rate-limited to prevent abuse:
- OTP endpoints: 20 requests/hour per email
- Other endpoints: 100 requests/minute per IP

## Error Responses

All error responses follow this format:

\`\`\`json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
\`\`\`

## Status Codes

- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`429\` - Too Many Requests
- \`500\` - Internal Server Error
        `,
        contact: {
          name: 'FarmCon Support',
          email: 'farmconsmarttechnology@gmail.com',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
        {
          url: 'https://farmcon.vercel.app',
          description: 'Production Server',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and authorization endpoints',
        },
        {
          name: 'Products',
          description: 'Product catalog management for suppliers',
        },
        {
          name: 'Crops',
          description: 'Farmer crop inventory and management',
        },
        {
          name: 'Crop Listings',
          description: 'Public crop trading marketplace',
        },
        {
          name: 'Equipment',
          description: 'Equipment rental marketplace',
        },
        {
          name: 'Orders',
          description: 'Order processing and management',
        },
        {
          name: 'Cart',
          description: 'Shopping cart operations',
        },
        {
          name: 'Market Prices',
          description: 'Real-time agricultural market prices',
        },
        {
          name: 'Weather',
          description: 'Weather data and forecasts',
        },
        {
          name: 'Search',
          description: 'Full-text search across products and crops',
        },
        {
          name: 'AI',
          description: 'AI-powered features (chatbot, price predictions, disease detection)',
        },
        {
          name: 'Deliveries',
          description: 'Delivery tracking and management',
        },
        {
          name: 'Drivers',
          description: 'Driver management',
        },
        {
          name: 'Suppliers',
          description: 'Supplier profiles and analytics',
        },
        {
          name: 'Notifications',
          description: 'Real-time notification system',
        },
        {
          name: 'Analytics',
          description: 'Business analytics and insights',
        },
        {
          name: 'Profile',
          description: 'User profile management',
        },
        {
          name: 'Categories',
          description: 'Product category management',
        },
        {
          name: 'Reviews',
          description: 'Product and service reviews',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your Bearer token from Supabase authentication',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message',
              },
              details: {
                type: 'string',
                description: 'Additional error details',
              },
            },
          },
          Profile: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              phone: { type: 'string' },
              role: {
                type: 'string',
                enum: ['farmer', 'consumer', 'supplier', 'admin'],
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number', format: 'float' },
              quantity: { type: 'integer' },
              unit: { type: 'string' },
              imageUrl: { type: 'string', format: 'uri' },
              categoryId: { type: 'string', format: 'uuid' },
              supplierId: { type: 'string', format: 'uuid' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Crop: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              variety: { type: 'string' },
              plantedDate: { type: 'string', format: 'date' },
              expectedHarvestDate: { type: 'string', format: 'date' },
              area: { type: 'number', format: 'float' },
              areaUnit: { type: 'string' },
              status: {
                type: 'string',
                enum: ['planted', 'growing', 'ready_to_harvest', 'harvested', 'sold'],
              },
              farmerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              orderNumber: { type: 'string' },
              userId: { type: 'string', format: 'uuid' },
              totalAmount: { type: 'number', format: 'float' },
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              },
              paymentMethod: { type: 'string' },
              shippingAddress: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          MarketPrice: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              commodity: { type: 'string' },
              market: { type: 'string' },
              state: { type: 'string' },
              district: { type: 'string' },
              minPrice: { type: 'number', format: 'float' },
              maxPrice: { type: 'number', format: 'float' },
              modalPrice: { type: 'number', format: 'float' },
              date: { type: 'string', format: 'date' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          PricePrediction: {
            type: 'object',
            properties: {
              commodity: { type: 'string' },
              currentPrice: { type: 'number', format: 'float' },
              predictions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    predictedPrice: { type: 'number', format: 'float' },
                    confidence: { type: 'number', format: 'float', minimum: 0, maximum: 1 },
                    trend: { type: 'string', enum: ['up', 'down', 'stable'] },
                  },
                },
              },
              aiInsights: { type: 'string' },
            },
          },
          DiseaseDetection: {
            type: 'object',
            properties: {
              disease: { type: 'string' },
              confidence: { type: 'number', format: 'float', minimum: 0, maximum: 1 },
              symptoms: { type: 'array', items: { type: 'string' } },
              treatment: { type: 'string' },
              prevention: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            },
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });

  return spec;
};
