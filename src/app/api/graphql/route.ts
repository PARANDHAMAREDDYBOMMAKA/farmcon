import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { DateTimeResolver } from 'graphql-scalars';
import { prisma } from '@/lib/prisma';
import { getCached, invalidateCache, cacheKeys, CACHE_TTL } from '@/lib/graphql-cache';

// GraphQL Type Definitions
const typeDefs = `
  scalar DateTime

  type Query {
    products(category: String, supplierId: ID): [Product!]!
    product(id: ID!): Product
    myOrders(status: String): [Order!]!
    crops(farmerId: ID): [Crop!]!
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    createOrder(input: CreateOrderInput!): Order!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String
    imageUrl: String
    supplierId: ID!
    supplier: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Order {
    id: ID!
    buyerId: ID!
    buyer: User
    status: String!
    totalAmount: Float!
    items: [OrderItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    id: ID!
    orderId: ID!
    productId: ID!
    product: Product
    quantity: Int!
    price: Float!
  }

  type Crop {
    id: ID!
    name: String!
    quantity: Float!
    unit: String!
    farmerId: ID!
    farmer: User
    harvestDate: DateTime
    createdAt: DateTime!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    createdAt: DateTime!
  }

  input CreateProductInput {
    name: String!
    description: String
    price: Float!
    category: String
    imageUrl: String
    supplierId: ID!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    category: String
    imageUrl: String
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    price: Float!
  }
`;

// GraphQL Resolvers - Connects to PostgreSQL via Prisma
const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    // Fetch products from PostgreSQL with caching
    products: async (_parent: any, args: { category?: string; supplierId?: string }) => {
      const cacheKey = cacheKeys.products(args.category, args.supplierId);

      return await getCached(cacheKey, CACHE_TTL.products, async () => {
        const where: any = {};
        if (args.category) where.category = args.category;
        if (args.supplierId) where.supplierId = args.supplierId;

        return await prisma.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
      });
    },

    // Fetch single product with caching
    product: async (_parent: any, args: { id: string }) => {
      const cacheKey = cacheKeys.product(args.id);

      return await getCached(cacheKey, CACHE_TTL.product, async () => {
        return await prisma.product.findUnique({
          where: { id: args.id },
        });
      });
    },

    // Fetch orders
    myOrders: async (_parent: any, args: { status?: string }) => {
      const where: any = {};
      if (args.status) where.status = args.status;

      return await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Fetch crops
    crops: async (_parent: any, args: { farmerId?: string }) => {
      const where: any = {};
      if (args.farmerId) where.farmerId = args.farmerId;

      return await prisma.crop.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Fetch users
    users: async () => {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    // Fetch single user
    user: async (_parent: any, args: { id: string }) => {
      return await prisma.user.findUnique({
        where: { id: args.id },
      });
    },
  },

  Mutation: {
    // Create product with cache invalidation
    createProduct: async (_parent: any, args: { input: any }) => {
      const product = await prisma.product.create({
        data: {
          name: args.input.name,
          description: args.input.description,
          price: args.input.price,
          category: args.input.category,
          imageUrl: args.input.imageUrl,
          supplierId: args.input.supplierId,
        },
      });

      // Invalidate products cache
      await invalidateCache('products*');

      return product;
    },

    // Update product with cache invalidation
    updateProduct: async (_parent: any, args: { id: string; input: any }) => {
      const product = await prisma.product.update({
        where: { id: args.id },
        data: args.input,
      });

      // Invalidate specific product and products list cache
      await invalidateCache(`product:${args.id}`);
      await invalidateCache('products*');

      return product;
    },

    // Delete product with cache invalidation
    deleteProduct: async (_parent: any, args: { id: string }) => {
      await prisma.product.delete({
        where: { id: args.id },
      });

      // Invalidate specific product and products list cache
      await invalidateCache(`product:${args.id}`);
      await invalidateCache('products*');

      return true;
    },

    // Create order
    createOrder: async (_parent: any, args: { input: any }) => {
      // Calculate total amount
      const totalAmount = args.input.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      return await prisma.order.create({
        data: {
          buyerId: 'current-user-id', // Replace with actual auth user ID
          status: 'pending',
          totalAmount,
          items: {
            create: args.input.items,
          },
        },
        include: {
          items: true,
        },
      });
    },
  },

  // Field Resolvers for nested data
  Product: {
    supplier: async (parent: any) => {
      // Return null if user table doesn't exist yet
      if (!parent.supplierId) return null;
      try {
        return await (prisma as any).user?.findUnique({
          where: { id: parent.supplierId },
        });
      } catch {
        return null;
      }
    },
  },

  Order: {
    buyer: async (parent: any) => {
      // Return null if user table doesn't exist yet
      if (!parent.buyerId) return null;
      try {
        return await (prisma as any).user?.findUnique({
          where: { id: parent.buyerId },
        });
      } catch {
        return null;
      }
    },
  },

  OrderItem: {
    product: async (parent: any) => {
      if (!parent.productId) return null;
      return await prisma.product.findUnique({
        where: { id: parent.productId },
      });
    },
  },

  Crop: {
    farmer: async (parent: any) => {
      // Return null if user table doesn't exist yet
      if (!parent.farmerId) return null;
      try {
        return await (prisma as any).user?.findUnique({
          where: { id: parent.farmerId },
        });
      } catch {
        return null;
      }
    },
  },
};

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create GraphQL Yoga instance
const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },

  // Enable GraphiQL in development
  graphiql: process.env.NODE_ENV === 'development',

  // CORS configuration
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    credentials: true,
  },
});

export { handleRequest as GET, handleRequest as POST };
