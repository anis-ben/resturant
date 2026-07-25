export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TableStatus = 'available' | 'occupied' | 'reserved';
export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
export type WaiterCallType = 'call_waiter' | 'request_bill';
export type WaiterCallStatus = 'pending' | 'resolved';
export type StaffRole = 'admin' | 'cashier' | 'kitchen' | 'waiter';
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'paid' | 'voided' | 'refunded';

/**
 * Database type definition matching @supabase/postgrest-js v2 (GenericTable contract).
 *
 * Rules applied (mirrors Supabase CLI output):
 * - Every table has `Relationships` to satisfy `GenericTable extends { Relationships: GenericRelationship[] }`.
 * - `Insert` types use explicit optional (`?`) fields for:
 *     - Fields with database-level defaults (id, created_at, status, etc.)
 *     - Nullable fields (string | null becomes `field?: string | null`)
 *   This prevents "not assignable to never" errors when object literals omit
 *   nullable/defaulted columns.
 * - `Update` types use `Partial<Row>` so any subset of columns is valid.
 * - GenericSchema (v2) only requires: Tables, Views, Functions — Enums/CompositeTypes removed.
 */
export interface Database {
  public: {
    Tables: {
      restaurant_settings: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          is_open: boolean;
          tax_rate: number;
          delivery_fee: number;
          min_delivery_order: number;
          whatsapp_number: string | null;
          phone_number: string | null;
          address: string | null;
          currency_symbol: string;
          business_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          is_open?: boolean;
          tax_rate?: number;
          delivery_fee?: number;
          min_delivery_order?: number;
          whatsapp_number?: string | null;
          phone_number?: string | null;
          address?: string | null;
          currency_symbol?: string;
          business_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['restaurant_settings']['Row']>;
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          table_number: number;
          access_token: string;
          status: TableStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_number: number;
          access_token: string;
          status?: TableStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tables']['Row']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          badges: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          badges?: string[];
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['menu_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      modifier_groups: {
        Row: {
          id: string;
          menu_item_id: string;
          title: string;
          is_required: boolean;
          min_selection: number;
          max_selection: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          title: string;
          is_required?: boolean;
          min_selection?: number;
          max_selection?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modifier_groups']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'modifier_groups_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          }
        ];
      };
      modifiers: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          extra_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          extra_price?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modifiers']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'modifiers_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'modifier_groups';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          type: OrderType;
          table_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          delivery_address: string | null;
          address_landmark: string | null;
          status: OrderStatus;
          total_amount: number;
          notes: string | null;
          cancelled_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          type: OrderType;
          table_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          delivery_address?: string | null;
          address_landmark?: string | null;
          status?: OrderStatus;
          total_amount: number;
          notes?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'orders_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'tables';
            referencedColumns: ['id'];
          }
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          old_status: string | null;
          new_status: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          old_status?: string | null;
          new_status: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_status_history']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          quantity: number;
          unit_price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          quantity: number;
          unit_price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          }
        ];
      };
      order_item_modifiers: {
        Row: {
          id: string;
          order_item_id: string;
          modifier_id: string | null;
          extra_price: number;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          modifier_id?: string | null;
          extra_price?: number;
        };
        Update: Partial<Database['public']['Tables']['order_item_modifiers']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'order_item_modifiers_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_item_modifiers_modifier_id_fkey';
            columns: ['modifier_id'];
            isOneToOne: false;
            referencedRelation: 'modifiers';
            referencedColumns: ['id'];
          }
        ];
      };
      waiter_calls: {
        Row: {
          id: string;
          table_id: string;
          type: WaiterCallType;
          status: WaiterCallStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          type: WaiterCallType;
          status?: WaiterCallStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['waiter_calls']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'waiter_calls_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'tables';
            referencedColumns: ['id'];
          }
        ];
      };
      staff_users: {
        Row: {
          id: string;
          full_name: string;
          role: StaffRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: StaffRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_users']['Row']>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          cashier_id: string | null;
          payment_method: PaymentMethod;
          amount_due: number;
          amount_tendered: number | null;
          change_due: number;
          discount_amount: number;
          tax_amount: number;
          receipt_number: string;
          status: PaymentStatus;
          void_reason: string | null;
          printed_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          cashier_id?: string | null;
          payment_method: PaymentMethod;
          amount_due: number;
          amount_tendered?: number | null;
          change_due?: number;
          discount_amount?: number;
          tax_amount?: number;
          receipt_number: string;
          status?: PaymentStatus;
          void_reason?: string | null;
          printed_count?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
