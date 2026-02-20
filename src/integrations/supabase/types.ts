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
      estimate_history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          estimate_id: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          estimate_id: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          estimate_id?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_history_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_history_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          cost_price: number | null
          created_at: string
          description: string
          discount_pct: number | null
          estimate_id: string
          id: string
          item_code: string | null
          item_type: Database["public"]["Enums"]["line_item_type"]
          labor_hours: number | null
          labor_rate: number | null
          line_total: number | null
          markup_pct: number | null
          position: number
          quantity: number
          tax_pct: number | null
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          description: string
          discount_pct?: number | null
          estimate_id: string
          id?: string
          item_code?: string | null
          item_type?: Database["public"]["Enums"]["line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          line_total?: number | null
          markup_pct?: number | null
          position?: number
          quantity?: number
          tax_pct?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          description?: string
          discount_pct?: number | null
          estimate_id?: string
          id?: string
          item_code?: string | null
          item_type?: Database["public"]["Enums"]["line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          line_total?: number | null
          markup_pct?: number | null
          position?: number
          quantity?: number
          tax_pct?: number | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_send_log: {
        Row: {
          estimate_id: string
          id: string
          ip_address: string | null
          sent_at: string
          sent_to_email: string
          status: string | null
        }
        Insert: {
          estimate_id: string
          id?: string
          ip_address?: string | null
          sent_at?: string
          sent_to_email: string
          status?: string | null
        }
        Update: {
          estimate_id?: string
          id?: string
          ip_address?: string | null
          sent_at?: string
          sent_to_email?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_send_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_send_log_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      estimates: {
        Row: {
          approved_at: string | null
          balance_due: number | null
          client_address: string | null
          client_comment: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          crm_lead_id: string | null
          crm_synced_at: string | null
          currency: string
          deposit_amount: number | null
          deposit_pct: number | null
          estimate_number: string
          exchange_rate: number | null
          extra_fees: number | null
          extra_fees_description: string | null
          global_discount_amount: number | null
          global_discount_pct: number | null
          global_tax_pct: number | null
          id: string
          locked: boolean | null
          notes: string | null
          paid_amount: number | null
          payment_due_date: string | null
          payment_method: string | null
          payment_recipient: string | null
          pdf_url: string | null
          prepayment_confirmed: boolean
          prepayment_confirmed_at: string | null
          prepayment_confirmed_by: string | null
          project_id: string | null
          public_token: string | null
          request_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number | null
          tax_amount: number | null
          title: string | null
          total: number | null
          updated_at: string
          valid_until: string | null
          version: number
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          balance_due?: number | null
          client_address?: string | null
          client_comment?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          crm_lead_id?: string | null
          crm_synced_at?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_pct?: number | null
          estimate_number: string
          exchange_rate?: number | null
          extra_fees?: number | null
          extra_fees_description?: string | null
          global_discount_amount?: number | null
          global_discount_pct?: number | null
          global_tax_pct?: number | null
          id?: string
          locked?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          payment_due_date?: string | null
          payment_method?: string | null
          payment_recipient?: string | null
          pdf_url?: string | null
          prepayment_confirmed?: boolean
          prepayment_confirmed_at?: string | null
          prepayment_confirmed_by?: string | null
          project_id?: string | null
          public_token?: string | null
          request_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number | null
          tax_amount?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          balance_due?: number | null
          client_address?: string | null
          client_comment?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          crm_lead_id?: string | null
          crm_synced_at?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_pct?: number | null
          estimate_number?: string
          exchange_rate?: number | null
          extra_fees?: number | null
          extra_fees_description?: string | null
          global_discount_amount?: number | null
          global_discount_pct?: number | null
          global_tax_pct?: number | null
          id?: string
          locked?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          payment_due_date?: string | null
          payment_method?: string | null
          payment_recipient?: string | null
          pdf_url?: string | null
          prepayment_confirmed?: boolean
          prepayment_confirmed_at?: string | null
          prepayment_confirmed_by?: string | null
          project_id?: string | null
          public_token?: string | null
          request_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number | null
          tax_amount?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_entries: {
        Row: {
          amount: number
          approved_by: string | null
          converted_amount: number | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          estimate_id: string | null
          exchange_rate: number | null
          fees: number | null
          gross_amount: number | null
          id: string
          net_amount: number | null
          payment_id: string | null
          project_id: string | null
          reason: string | null
          receipt_url: string | null
          requires_approval: boolean | null
          source: string
          tags_json: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          converted_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          estimate_id?: string | null
          exchange_rate?: number | null
          fees?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_id?: string | null
          project_id?: string | null
          reason?: string | null
          receipt_url?: string | null
          requires_approval?: boolean | null
          source?: string
          tags_json?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          converted_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          estimate_id?: string | null
          exchange_rate?: number | null
          fees?: number | null
          gross_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_id?: string | null
          project_id?: string | null
          reason?: string | null
          receipt_url?: string | null
          requires_approval?: boolean | null
          source?: string
          tags_json?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_entries_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      line_item_presets: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          item_code: string | null
          item_type: Database["public"]["Enums"]["line_item_type"]
          labor_hours: number | null
          labor_rate: number | null
          markup_pct: number | null
          name: string
          quantity: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_type?: Database["public"]["Enums"]["line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          markup_pct?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          item_code?: string | null
          item_type?: Database["public"]["Enums"]["line_item_type"]
          labor_hours?: number | null
          labor_rate?: number | null
          markup_pct?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string | null
          author_role: string | null
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note_type: string
        }
        Insert: {
          author_id?: string | null
          author_role?: string | null
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note_type?: string
        }
        Update: {
          author_id?: string | null
          author_role?: string | null
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          payload_json: Json | null
          status: string
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          payload_json?: Json | null
          status?: string
          title?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          payload_json?: Json | null
          status?: string
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          estimate_id: string
          fees: number | null
          gross_amount: number | null
          id: string
          method: string | null
          net_amount: number | null
          receipt_url: string | null
          recipient: string | null
          reference: string | null
          status: string
          updated_at: string
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          estimate_id: string
          fees?: number | null
          gross_amount?: number | null
          id?: string
          method?: string | null
          net_amount?: number | null
          receipt_url?: string | null
          recipient?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          estimate_id?: string
          fees?: number | null
          gross_amount?: number | null
          id?: string
          method?: string | null
          net_amount?: number | null
          receipt_url?: string | null
          recipient?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          request_id: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          phone: string
          service_type: string
          source: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          phone: string
          service_type: string
          source?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          phone?: string
          service_type?: string
          source?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          immutable: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          immutable?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          immutable?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_examples: {
        Row: {
          after_image_url: string
          before_image_url: string
          category: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url: string
          before_image_url: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string
          before_image_url?: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      estimates_public: {
        Row: {
          approved_at: string | null
          balance_due: number | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          deposit_amount: number | null
          deposit_pct: number | null
          estimate_number: string | null
          exchange_rate: number | null
          extra_fees: number | null
          extra_fees_description: string | null
          global_discount_amount: number | null
          global_discount_pct: number | null
          global_tax_pct: number | null
          id: string | null
          notes: string | null
          payment_due_date: string | null
          public_token: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          subtotal: number | null
          tax_amount: number | null
          title: string | null
          total: number | null
          updated_at: string | null
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          balance_due?: number | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_pct?: number | null
          estimate_number?: string | null
          exchange_rate?: number | null
          extra_fees?: number | null
          extra_fees_description?: string | null
          global_discount_amount?: number | null
          global_discount_pct?: number | null
          global_tax_pct?: number | null
          id?: string | null
          notes?: string | null
          payment_due_date?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          balance_due?: number | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_pct?: number | null
          estimate_number?: string | null
          exchange_rate?: number | null
          extra_fees?: number | null
          extra_fees_description?: string | null
          global_discount_amount?: number | null
          global_discount_pct?: number | null
          global_tax_pct?: number | null
          id?: string | null
          notes?: string | null
          payment_due_date?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_line_item_total: {
        Args: {
          p_discount_pct: number
          p_labor_hours: number
          p_labor_rate: number
          p_markup_pct: number
          p_quantity: number
          p_tax_pct: number
          p_unit_price: number
        }
        Returns: number
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_estimate_number: { Args: never; Returns: string }
      generate_public_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_estimate_totals: {
        Args: { p_estimate_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "guest"
        | "user"
        | "admin"
        | "manager"
        | "technician"
        | "super_admin"
      estimate_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "converted"
        | "rejected"
        | "pending_prepayment"
        | "prepayment_received"
        | "in_progress"
        | "completed"
        | "closed"
      line_item_type: "material" | "labor" | "service" | "other"
      request_status: "new" | "in_progress" | "done"
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
      app_role: [
        "guest",
        "user",
        "admin",
        "manager",
        "technician",
        "super_admin",
      ],
      estimate_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "converted",
        "rejected",
        "pending_prepayment",
        "prepayment_received",
        "in_progress",
        "completed",
        "closed",
      ],
      line_item_type: ["material", "labor", "service", "other"],
      request_status: ["new", "in_progress", "done"],
    },
  },
} as const
