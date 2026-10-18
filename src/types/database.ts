export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country_code: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country_code: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_subtotal_cents: number
          redemption_count: number
          starts_at: string | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_subtotal_cents?: number
          redemption_count?: number
          starts_at?: string | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_subtotal_cents?: number
          redemption_count?: number
          starts_at?: string | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string | null
          quantity_change: number
          reason: Database["public"]["Enums"]["inventory_reason"]
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          quantity_change: number
          reason: Database["public"]["Enums"]["inventory_reason"]
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          quantity_change?: number
          reason?: Database["public"]["Enums"]["inventory_reason"]
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          line_total_cents: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string
          unit_price_cents: number
          variant_id: string | null
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          line_total_cents: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku: string
          unit_price_cents: number
          variant_id?: string | null
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          line_total_cents?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string
          unit_price_cents?: number
          variant_id?: string | null
          variant_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          discount_cents: number
          discount_code: string | null
          discount_code_id: string | null
          email: string
          id: string
          order_number: string
          paid_at: string | null
          reservation_expires_at: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_cents: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          tracking_carrier: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          discount_cents?: number
          discount_code?: string | null
          discount_code_id?: string | null
          email: string
          id?: string
          order_number?: string
          paid_at?: string | null
          reservation_expires_at?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          tax_cents?: number
          total_cents: number
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          discount_cents?: number
          discount_code?: string | null
          discount_code_id?: string | null
          email?: string
          id?: string
          order_number?: string
          paid_at?: string | null
          reservation_expires_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          position: number
          product_id: string
          storage_path: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          position?: number
          product_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          id: string
          option_id: string
          position: number
          swatch_hex: string | null
          value: string
        }
        Insert: {
          id?: string
          option_id: string
          position?: number
          swatch_hex?: string | null
          value: string
        }
        Update: {
          id?: string
          option_id?: string
          position?: number
          swatch_hex?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          id: string
          name: string
          position: number
          product_id: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          product_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_options: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_options_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price_cents: number | null
          created_at: string
          id: string
          image_id: string | null
          is_active: boolean
          low_stock_threshold: number
          position: number
          price_cents: number
          product_id: string
          sku: string
          stock_quantity: number
          title: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          compare_at_price_cents?: number | null
          created_at?: string
          id?: string
          image_id?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          position?: number
          price_cents: number
          product_id: string
          sku: string
          stock_quantity?: number
          title?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          compare_at_price_cents?: number | null
          created_at?: string
          id?: string
          image_id?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          position?: number
          price_cents?: number
          product_id?: string
          sku?: string
          stock_quantity?: number
          title?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_rating: number
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          max_price_cents: number | null
          min_price_cents: number | null
          name: string
          published_at: string | null
          review_count: number
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          specifications: Json
          status: Database["public"]["Enums"]["product_status"]
          total_stock: number
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          max_price_cents?: number | null
          min_price_cents?: number | null
          name: string
          published_at?: string | null
          review_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          total_stock?: number
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          max_price_cents?: number | null
          min_price_cents?: number | null
          name?: string
          published_at?: string | null
          review_count?: number
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_verified_purchase: boolean
          moderated_at: string | null
          moderated_by: string | null
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          announcement_text: string | null
          currency: string
          flat_shipping_cents: number
          free_shipping_threshold_cents: number | null
          id: number
          store_name: string
          support_email: string | null
          tax_rate_bps: number
          updated_at: string
        }
        Insert: {
          announcement_text?: string | null
          currency?: string
          flat_shipping_cents?: number
          free_shipping_threshold_cents?: number | null
          id?: number
          store_name?: string
          support_email?: string | null
          tax_rate_bps?: number
          updated_at?: string
        }
        Update: {
          announcement_text?: string | null
          currency?: string
          flat_shipping_cents?: number
          free_shipping_threshold_cents?: number | null
          id?: number
          store_name?: string
          support_email?: string | null
          tax_rate_bps?: number
          updated_at?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          id: string
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_variant_stock: {
        Args: {
          p_change: number
          p_note?: string
          p_reason: Database["public"]["Enums"]["inventory_reason"]
          p_variant_id: string
        }
        Returns: number
      }
      get_product_reviews: {
        Args: { p_product_id: string }
        Returns: {
          author_name: string
          body: string
          created_at: string
          id: string
          is_verified_purchase: boolean
          rating: number
          title: string
        }[]
      }
      has_purchased_product: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_privileged_context: { Args: never; Returns: boolean }
      refresh_product_rating: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      refresh_product_variant_stats: {
        Args: { p_product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      discount_type: "percentage" | "fixed_amount"
      inventory_reason:
        | "initial"
        | "restock"
        | "adjustment"
        | "reservation"
        | "reservation_release"
        | "return"
      order_status:
        | "pending_payment"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      product_status: "draft" | "active" | "archived"
      review_status: "pending" | "approved" | "rejected"
      user_role: "customer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_type: ["percentage", "fixed_amount"],
      inventory_reason: [
        "initial",
        "restock",
        "adjustment",
        "reservation",
        "reservation_release",
        "return",
      ],
      order_status: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      product_status: ["draft", "active", "archived"],
      review_status: ["pending", "approved", "rejected"],
      user_role: ["customer", "admin"],
    },
  },
} as const
