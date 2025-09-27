-- Setup RLS policies for orders and related tables
-- This fixes the "permission denied for schema public" error

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own orders as customer" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders as seller" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders as customer" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders as seller" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "System can create order items" ON public.order_items;

-- Policy to allow users to view orders where they are the customer
CREATE POLICY "Users can view their own orders as customer" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id::uuid);

-- Policy to allow users to view orders where they are the seller
CREATE POLICY "Users can view their own orders as seller" ON public.orders
    FOR SELECT USING (auth.uid() = seller_id::uuid);

-- Policy to allow users to create orders as customer
CREATE POLICY "Users can create orders as customer" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id::uuid);

-- Policy to allow sellers to update their own orders (status changes)
CREATE POLICY "Users can update their own orders as seller" ON public.orders
    FOR UPDATE USING (auth.uid() = seller_id::uuid);

-- Policy to allow users to view order items for orders they're involved in
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.customer_id::uuid = auth.uid() OR orders.seller_id::uuid = auth.uid())
        )
    );

-- Policy to allow creating order items (this should be done by authenticated users creating orders)
CREATE POLICY "System can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id::uuid = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- Grant broader permissions to service_role for backend operations
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- Allow anonymous users to read public data (if needed for certain endpoints)
-- GRANT SELECT ON public.orders TO anon;  -- Uncomment if needed
-- GRANT SELECT ON public.order_items TO anon;  -- Uncomment if needed

-- You can run this script in your Supabase SQL editor