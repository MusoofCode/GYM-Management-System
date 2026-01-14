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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          checked_in_by: string | null
          checked_out_by: string | null
          created_at: string | null
          id: string
          qr_code_scanned: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          created_at?: string | null
          id?: string
          qr_code_scanned?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          created_at?: string | null
          id?: string
          qr_code_scanned?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      class_bookings: {
        Row: {
          booking_date: string
          class_id: string
          created_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          class_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          class_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          class_type: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          schedule_day: string
          schedule_time: string
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          class_type?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          schedule_day: string
          schedule_time: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          class_type?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          schedule_day?: string
          schedule_time?: string
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          used_count: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          used_count?: number | null
          valid_from: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      membership_history: {
        Row: {
          action: string
          amount: number | null
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          performed_by: string | null
          plan_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          action: string
          amount?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          plan_id: string
          start_date: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          plan_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_months: number
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_months: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_months?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string
          freeze_end_date: string | null
          freeze_reason: string | null
          freeze_start_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string | null
          plan_id: string
          qr_code: string | null
          start_date: string
          status: Database["public"]["Enums"]["membership_status"] | null
          transferred_from: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date: string
          freeze_end_date?: string | null
          freeze_reason?: string | null
          freeze_start_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          plan_id: string
          qr_code?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["membership_status"] | null
          transferred_from?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string
          freeze_end_date?: string | null
          freeze_reason?: string | null
          freeze_start_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string | null
          plan_id?: string
          qr_code?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"] | null
          transferred_from?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_transferred_from_fkey"
            columns: ["transferred_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          priority: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          priority?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          coupon_id: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          id: string
          invoice_number: string | null
          invoice_path: string | null
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          promo_code: string | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          invoice_path?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          promo_code?: string | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          invoice_path?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          promo_code?: string | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          bonus: number | null
          created_at: string | null
          deductions: number | null
          id: string
          net_amount: number
          notes: string | null
          paid_by: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_period_end: string
          payment_period_start: string
          payment_status: string
          salary_amount: number
          staff_user_id: string
          updated_at: string | null
        }
        Insert: {
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          net_amount: number
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_period_end: string
          payment_period_start: string
          payment_status?: string
          salary_amount: number
          staff_user_id: string
          updated_at?: string | null
        }
        Update: {
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          net_amount?: number
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_period_end?: string
          payment_period_start?: string
          payment_status?: string
          salary_amount?: number
          staff_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          last_restocked: string | null
          low_stock_alert: number | null
          name: string
          price: number
          reorder_level: number | null
          sku: string | null
          stock_quantity: number | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_restocked?: string | null
          low_stock_alert?: number | null
          name: string
          price: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_restocked?: string | null
          low_stock_alert?: number | null
          name?: string
          price?: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          blood_group: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: string | null
          id: string
          joined_date: string | null
          medical_conditions: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          joined_date?: string | null
          medical_conditions?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          joined_date?: string | null
          medical_conditions?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          arms: number | null
          bmi: number | null
          body_fat_percentage: number | null
          chest: number | null
          created_at: string | null
          hips: number | null
          id: string
          measurement_date: string
          notes: string | null
          thighs: number | null
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arms?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string | null
          hips?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          thighs?: number | null
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arms?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string | null
          hips?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          thighs?: number | null
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          customer_name: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id: string
          quantity: number
          sale_date: string | null
          sold_by: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          customer_name?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id: string
          quantity: number
          sale_date?: string | null
          sold_by: string
          total_amount: number
          unit_price: number
        }
        Update: {
          customer_name?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id?: string
          quantity?: number
          sale_date?: string | null
          sold_by?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          availability: Json | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          specialization: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          specialization?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          specialization?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          member_id: string
          notes: string | null
          session_date: string
          session_time: string
          status: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          member_id: string
          notes?: string | null
          session_date: string
          session_time: string
          status?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          member_id?: string
          notes?: string | null
          session_date?: string
          session_time?: string
          status?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          exercises: Json | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          trainer_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          exercises?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          trainer_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          exercises?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          trainer_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_membership_stats: {
        Args: never
        Returns: {
          active_members: number
          expired_members: number
          frozen_members: number
          total_members: number
        }[]
      }
      get_revenue_stats: {
        Args: { end_date: string; start_date: string }
        Returns: {
          membership_revenue: number
          product_revenue: number
          total_revenue: number
          training_revenue: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_member_for_checkin: {
        Args: { _search_term: string }
        Returns: {
          email: string
          full_name: string
          has_active_membership: boolean
          membership_status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }[]
      }
      validate_qr_code: {
        Args: { _qr_code: string }
        Returns: {
          full_name: string
          is_valid: boolean
          membership_end_date: string
          membership_status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "trainer" | "member"
      booking_status: "confirmed" | "cancelled" | "waitlist" | "completed"
      membership_status: "active" | "expired" | "pending" | "frozen"
      notification_type:
        | "membership_expiry"
        | "payment_reminder"
        | "class_reminder"
        | "system_announcement"
      payment_method: "cash" | "card" | "mobile_money" | "bank_transfer"
      payment_type: "membership" | "personal_training" | "product" | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "staff", "trainer", "member"],
      booking_status: ["confirmed", "cancelled", "waitlist", "completed"],
      membership_status: ["active", "expired", "pending", "frozen"],
      notification_type: [
        "membership_expiry",
        "payment_reminder",
        "class_reminder",
        "system_announcement",
      ],
      payment_method: ["cash", "card", "mobile_money", "bank_transfer"],
      payment_type: ["membership", "personal_training", "product", "other"],
    },
  },
} as const
