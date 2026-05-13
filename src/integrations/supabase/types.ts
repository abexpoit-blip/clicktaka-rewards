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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      deposits: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          processed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          transaction_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          daily_income: number
          daily_tasks: number
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          daily_income: number
          daily_tasks?: number
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          daily_income?: number
          daily_tasks?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bkash_number: string
          id: number
          min_deposit: number
          min_withdraw: number
          nagad_number: string
          referral_percent: number
        }
        Insert: {
          bkash_number?: string
          id?: number
          min_deposit?: number
          min_withdraw?: number
          nagad_number?: string
          referral_percent?: number
        }
        Update: {
          bkash_number?: string
          id?: number
          min_deposit?: number
          min_withdraw?: number
          nagad_number?: string
          referral_percent?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_blocked: boolean
          name: string
          payment_number: string | null
          phone: string
          refer_code: string
          referred_by: string | null
          total_earned: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id: string
          is_blocked?: boolean
          name?: string
          payment_number?: string | null
          phone: string
          refer_code: string
          referred_by?: string | null
          total_earned?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_blocked?: boolean
          name?: string
          payment_number?: string | null
          phone?: string
          refer_code?: string
          referred_by?: string | null
          total_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_earned: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_earned?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_earned?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          reward: number
          task_id: string
          user_id: string
          user_package_id: string | null
        }
        Insert: {
          completed_at?: string
          id?: string
          reward?: number
          task_id: string
          user_id: string
          user_package_id?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          reward?: number
          task_id?: string
          user_id?: string
          user_package_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_package_id_fkey"
            columns: ["user_package_id"]
            isOneToOne: false
            referencedRelation: "user_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ad_url: string | null
          created_at: string
          id: string
          is_active: boolean
          title: string
          view_seconds: number
        }
        Insert: {
          ad_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          view_seconds?: number
        }
        Update: {
          ad_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          view_seconds?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          ref_id: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          ref_id?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          ref_id?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_packages: {
        Row: {
          daily_income: number
          daily_tasks: number
          duration_days: number
          expires_at: string
          id: string
          is_active: boolean
          last_claim_date: string | null
          package_id: string
          price_paid: number
          purchased_at: string
          tasks_done_today: number
          user_id: string
        }
        Insert: {
          daily_income: number
          daily_tasks: number
          duration_days: number
          expires_at: string
          id?: string
          is_active?: boolean
          last_claim_date?: string | null
          package_id: string
          price_paid: number
          purchased_at?: string
          tasks_done_today?: number
          user_id: string
        }
        Update: {
          daily_income?: number
          daily_tasks?: number
          duration_days?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          last_claim_date?: string | null
          package_id?: string
          price_paid?: number
          purchased_at?: string
          tasks_done_today?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          phone: string
          processed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          phone: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          phone?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_refer_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      payment_method: "bkash" | "nagad"
      request_status: "pending" | "approved" | "rejected"
      txn_type:
        | "deposit"
        | "withdraw"
        | "income"
        | "package"
        | "referral"
        | "admin_adjust"
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
      app_role: ["admin", "user"],
      payment_method: ["bkash", "nagad"],
      request_status: ["pending", "approved", "rejected"],
      txn_type: [
        "deposit",
        "withdraw",
        "income",
        "package",
        "referral",
        "admin_adjust",
      ],
    },
  },
} as const
