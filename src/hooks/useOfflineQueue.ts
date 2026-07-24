'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { OrderStatus } from '@/types/database.types';
import {
  addPendingAction,
  getPendingActions,
  removePendingAction,
} from '@/lib/indexeddb';

// Internal type guard to narrow newStatus strings to valid OrderStatus values
function isValidOrderStatus(s: string): s is OrderStatus {
  return ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'].includes(s);
}

export function useOfflineQueue(onSyncSuccess?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [conflictNotification, setConflictNotification] = useState<string | null>(null);

  // Monitor network online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingCount(actions.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Sync queued pending actions with Supabase when online
  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const actions = await getPendingActions();
    if (actions.length === 0) return;

    setIsSyncing(true);

    for (const action of actions) {
      try {
        // Fetch current status to check conflict
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('status, updated_at')
          .eq('id', action.orderId)
          .single();

        // If status was modified on server by another staff member, notify conflict
        if (currentOrder && currentOrder.status !== action.newStatus) {
          if (!isValidOrderStatus(action.newStatus)) {
            await removePendingAction(action.id);
            continue;
          }
          // Last-write-wins update
          const { error } = await supabase
            .from('orders')
            .update({
              status: action.newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', action.orderId);

          if (!error) {
            await removePendingAction(action.id);
          }
        } else {
          await removePendingAction(action.id);
        }
      } catch (e) {
        console.error('Failed to sync action:', action, e);
      }
    }

    setIsSyncing(false);
    await refreshPendingCount();
    if (onSyncSuccess) onSyncSuccess();
  }, [isSyncing, refreshPendingCount, onSyncSuccess]);

  useEffect(() => {
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  /**
   * Updates order status optimistically when online, or queues to IndexedDB when offline.
   * @param orderId - The UUID of the target order.
   * @param newStatus - The validated target OrderStatus string.
   */
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;
        if (onSyncSuccess) onSyncSuccess();
        return { success: true, queued: false };
      } catch (err) {
        // If the live request fails, queue the action for retry
        console.warn('[OfflineQueue] Update failed, queuing for retry:', err);
        await addPendingAction({ orderId, newStatus });
        await refreshPendingCount();
        return { success: true, queued: true };
      }
    } else {
      // Offline: Add to IndexedDB queue for sync on reconnect
      await addPendingAction({ orderId, newStatus });
      await refreshPendingCount();
      return { success: true, queued: true };
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    conflictNotification,
    setConflictNotification,
    updateOrderStatus,
    syncQueue,
  };
}
