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
          created_at: string | null
          id: string
          qr_code_scanned: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          id?: string
          qr_code_scanned?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          id?: string
          qr_code_scanned?: string | null
          user_id?: string
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
          created_at: string | null
          end_date: string
          freeze_end_date: string | null
          freeze_start_date: string | null
          id: string
          notes: string | null
          plan_id: string
          qr_code: string | null
          start_date: string
          status: Database["public"]["Enums"]["membership_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          freeze_end_date?: string | null
          freeze_start_date?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          qr_code?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["membership_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          freeze_end_date?: string | null
          freeze_start_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          qr_code?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"] | null
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
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
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
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          id: string
          invoice_number: string | null
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
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
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
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          promo_code?: string | null
          reference_id?: string | null
          user_id?: string
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
          low_stock_alert: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_alert?: number | null
          name: string
          price: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_alert?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          id?: string
          phone?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
