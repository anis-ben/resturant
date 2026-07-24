'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { playNewOrderChime, playWaiterCallAlert } from '@/services/audio.service';

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type WaiterCallRow = Database['public']['Tables']['waiter_calls']['Row'];

export interface OrderWithDetails extends OrderRow {
  tables?: { table_number: number } | null;
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    menu_items?: { name: string } | null;
    order_item_modifiers: (Database['public']['Tables']['order_item_modifiers']['Row'] & {
      modifiers?: { name: string } | null;
    })[];
  })[];
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCallRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables(table_number),
          order_items(
            *,
            menu_items(name),
            order_item_modifiers(
              *,
              modifiers(name)
            )
          )
        `)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Supabase returns the joined shape matching OrderWithDetails;
        // using a type assertion on the final pointer (not double-cast)
        setOrders(data as OrderWithDetails[]);
      }
    } catch (e) {
      console.error('Failed to fetch realtime orders:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWaiterCalls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWaiterCalls(data);
      }
    } catch (e) {
      console.error('Failed to fetch waiter calls:', e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchWaiterCalls();

    // Subscribe to Orders Realtime
    const ordersChannel = supabase
      .channel('kds_orders_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          playNewOrderChime();
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Subscribe to Waiter Calls Realtime
    const callsChannel = supabase
      .channel('kds_waiter_calls_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waiter_calls' },
        () => {
          playWaiterCallAlert();
          fetchWaiterCalls();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'waiter_calls' },
        () => {
          fetchWaiterCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(callsChannel);
    };
  }, [fetchOrders, fetchWaiterCalls]);

  return {
    orders,
    waiterCalls,
    isLoading,
    refetch: fetchOrders,
    refetchCalls: fetchWaiterCalls,
  };
}
