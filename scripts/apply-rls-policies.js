const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyRLSPolicies() {
  try {
    console.log('🔒 Applying Row Level Security policies for orders...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✅ Enabled RLS on orders table')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✅ Enabled RLS on order_items table')

    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own orders as customer" ON public.orders;',
      'DROP POLICY IF EXISTS "Users can view their own orders as seller" ON public.orders;',
      'DROP POLICY IF EXISTS "Users can create orders as customer" ON public.orders;',
      'DROP POLICY IF EXISTS "Users can update their own orders as seller" ON public.orders;',
      'DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;',
      'DROP POLICY IF EXISTS "System can create order items" ON public.order_items;'
    ]

    for (const policy of dropPolicies) {
      await prisma.$executeRawUnsafe(policy)
    }
    console.log('✅ Dropped existing policies')

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view their own orders as customer" ON public.orders
        FOR SELECT USING (auth.uid() = customer_id::uuid);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view their own orders as seller" ON public.orders
        FOR SELECT USING (auth.uid() = seller_id::uuid);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can create orders as customer" ON public.orders
        FOR INSERT WITH CHECK (auth.uid() = customer_id::uuid);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update their own orders as seller" ON public.orders
        FOR UPDATE USING (auth.uid() = seller_id::uuid);
    `)

    console.log('✅ Created orders table policies')

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view order items for their orders" ON public.order_items
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.customer_id::uuid = auth.uid() OR orders.seller_id::uuid = auth.uid())
          )
        );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "System can create order items" ON public.order_items
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id::uuid = auth.uid()
          )
        );
    `)

    console.log('✅ Created order_items table policies')

    await prisma.$executeRawUnsafe(`
      GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
    `)

    await prisma.$executeRawUnsafe(`
      GRANT SELECT, INSERT ON public.order_items TO authenticated;
    `)

    console.log('✅ Granted permissions to authenticated users')

    await prisma.$executeRawUnsafe(`
      GRANT ALL ON public.orders TO service_role;
    `)

    await prisma.$executeRawUnsafe(`
      GRANT ALL ON public.order_items TO service_role;
    `)

    console.log('✅ Granted service_role permissions')

    console.log('🎉 All RLS policies applied successfully!')
    console.log('📋 Orders table now has proper Row Level Security')
    console.log('🔐 Users can only see their own orders (as customer or seller)')

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyRLSPolicies()
  .then(() => {
    console.log('✨ RLS policies application completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to apply RLS policies:', error)
    process.exit(1)
  })