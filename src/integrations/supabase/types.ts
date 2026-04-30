export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      catalog_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          unit: string;
          base_price: number;
          market_min: number | null;
          market_max: number | null;
          category: string;
          tags: Json | null;
          synonyms: Json | null;
          complexity: string;
          popularity_score: number;
          is_hidden: boolean;
          calc_default: string | null;
          special_type: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          unit?: string;
          base_price?: number;
          market_min?: number | null;
          market_max?: number | null;
          category: string;
          tags?: Json | null;
          synonyms?: Json | null;
          complexity?: string;
          popularity_score?: number;
          is_hidden?: boolean;
          calc_default?: string | null;
          special_type?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          unit?: string;
          base_price?: number;
          market_min?: number | null;
          market_max?: number | null;
          category?: string;
          tags?: Json | null;
          synonyms?: Json | null;
          complexity?: string;
          popularity_score?: number;
          is_hidden?: boolean;
          calc_default?: string | null;
          special_type?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      estimate_line_items: {
        Row: {
          id: string;
          estimate_id: string;
          position: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          item_code: string | null;
          description: string;
          unit: string;
          quantity: number;
          unit_price: number;
          labor_hours: number;
          labor_rate: number;
          cost_price: number;
          markup_pct: number;
          discount_pct: number;
          tax_pct: number;
          line_total: number;
          catalog_item_id: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          position?: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          item_code?: string | null;
          description: string;
          unit?: string;
          quantity?: number;
          unit_price?: number;
          labor_hours?: number;
          labor_rate?: number;
          cost_price?: number;
          markup_pct?: number;
          discount_pct?: number;
          tax_pct?: number;
          line_total?: number;
          catalog_item_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          position?: number;
          item_type?: Database["public"]["Enums"]["line_item_type"];
          item_code?: string | null;
          description?: string;
          unit?: string;
          quantity?: number;
          unit_price?: number;
          labor_hours?: number;
          labor_rate?: number;
          cost_price?: number;
          markup_pct?: number;
          discount_pct?: number;
          tax_pct?: number;
          line_total?: number;
          catalog_item_id?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey";
            columns: ["estimate_id"];
            isOneToOne: false;
            referencedRelation: "estimates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimate_line_items_catalog_item_id_fkey";
            columns: ["catalog_item_id"];
            isOneToOne: false;
            referencedRelation: "catalog_items";
            referencedColumns: ["id"];
          },
        ];
      };
      estimates: {
        Row: {
          id: string;
          estimate_number: string;
          title: string | null;
          status: Database["public"]["Enums"]["estimate_status"];
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          client_address: string | null;
          request_id: string | null;
          project_id: string | null;
          object_id: string | null;
          version: number;
          currency: string;
          exchange_rate: number;
          global_discount_pct: number;
          global_discount_amount: number;
          global_tax_pct: number;
          extra_fees: number;
          extra_fees_description: string | null;
          deposit_pct: number;
          deposit_amount: number;
          payment_method: string | null;
          payment_recipient: string | null;
          prepayment_confirmed: boolean;
          prepayment_confirmed_at: string | null;
          prepayment_confirmed_by: string | null;
          subtotal: number;
          tax_amount: number;
          total: number;
          balance_due: number;
          valid_until: string | null;
          payment_due_date: string | null;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
          viewed_at: string | null;
          approved_at: string | null;
          public_token: string | null;
          pdf_url: string | null;
          created_by: string | null;
          notes: string | null;
          crm_lead_id: string | null;
          crm_synced_at: string | null;
          client_comment: string | null;
          locked: boolean;
          paid_amount: number;
        };
        Insert: {
          id?: string;
          estimate_number?: string;
          title?: string | null;
          status?: Database["public"]["Enums"]["estimate_status"];
          client_name: string;
          client_email?: string | null;
          client_phone?: string | null;
          client_address?: string | null;
          request_id?: string | null;
          project_id?: string | null;
          object_id?: string | null;
          version?: number;
          currency?: string;
          exchange_rate?: number;
          global_discount_pct?: number;
          global_discount_amount?: number;
          global_tax_pct?: number;
          extra_fees?: number;
          extra_fees_description?: string | null;
          deposit_pct?: number;
          deposit_amount?: number;
          payment_method?: string | null;
          payment_recipient?: string | null;
          prepayment_confirmed?: boolean;
          prepayment_confirmed_at?: string | null;
          prepayment_confirmed_by?: string | null;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          balance_due?: number;
          valid_until?: string | null;
          payment_due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          public_token?: string | null;
          pdf_url?: string | null;
          created_by?: string | null;
          notes?: string | null;
          crm_lead_id?: string | null;
          crm_synced_at?: string | null;
          client_comment?: string | null;
          locked?: boolean;
          paid_amount?: number;
        };
        Update: {
          id?: string;
          estimate_number?: string;
          title?: string | null;
          status?: Database["public"]["Enums"]["estimate_status"];
          client_name?: string;
          client_email?: string | null;
          client_phone?: string | null;
          client_address?: string | null;
          request_id?: string | null;
          project_id?: string | null;
          object_id?: string | null;
          version?: number;
          currency?: string;
          exchange_rate?: number;
          global_discount_pct?: number;
          global_discount_amount?: number;
          global_tax_pct?: number;
          extra_fees?: number;
          extra_fees_description?: string | null;
          deposit_pct?: number;
          deposit_amount?: number;
          payment_method?: string | null;
          payment_recipient?: string | null;
          prepayment_confirmed?: boolean;
          prepayment_confirmed_at?: string | null;
          prepayment_confirmed_by?: string | null;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          balance_due?: number;
          valid_until?: string | null;
          payment_due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          public_token?: string | null;
          pdf_url?: string | null;
          created_by?: string | null;
          notes?: string | null;
          crm_lead_id?: string | null;
          crm_synced_at?: string | null;
          client_comment?: string | null;
          locked?: boolean;
          paid_amount?: number;
        };
        Relationships: [];
      };
      line_item_presets: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string | null;
          unit: string;
          unit_price: number;
          labor_hours: number;
          labor_rate: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          category?: string | null;
          unit?: string;
          unit_price?: number;
          labor_hours?: number;
          labor_rate?: number;
          item_type?: Database["public"]["Enums"]["line_item_type"];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string | null;
          unit?: string;
          unit_price?: number;
          labor_hours?: number;
          labor_rate?: number;
          item_type?: Database["public"]["Enums"]["line_item_type"];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string | null;
          address: string | null;
          request_id: string | null;
          client_name: string;
          client_phone: string | null;
          client_email: string | null;
          client_address: string | null;
          source: string;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          address?: string | null;
          request_id?: string | null;
          client_name: string;
          client_phone?: string | null;
          client_email?: string | null;
          client_address?: string | null;
          source?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          address?: string | null;
          request_id?: string | null;
          client_name?: string;
          client_phone?: string | null;
          client_email?: string | null;
          client_address?: string | null;
          source?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_objects: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          address: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          object_id: string | null;
          user_id: string;
          role: string;
          payout_type: string;
          fixed_amount: number;
          percent_share: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          object_id?: string | null;
          user_id: string;
          role: string;
          payout_type?: string;
          fixed_amount?: number;
          percent_share?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          object_id?: string | null;
          user_id?: string;
          role?: string;
          payout_type?: string;
          fixed_amount?: number;
          percent_share?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          estimate_id: string;
          project_id: string | null;
          object_id: string | null;
          account_id: string | null;
          amount: number;
          currency: string;
          method: string | null;
          recipient: string | null;
          reference: string | null;
          receipt_url: string | null;
          status: string;
          verified: boolean;
          verified_by: string | null;
          fees: number;
          gross_amount: number;
          net_amount: number;
          created_by: string | null;
          created_at: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          project_id?: string | null;
          object_id?: string | null;
          account_id?: string | null;
          amount?: number;
          currency?: string;
          method?: string | null;
          recipient?: string | null;
          reference?: string | null;
          receipt_url?: string | null;
          status?: string;
          verified?: boolean;
          verified_by?: string | null;
          fees?: number;
          gross_amount?: number;
          net_amount?: number;
          created_by?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          project_id?: string | null;
          object_id?: string | null;
          account_id?: string | null;
          amount?: number;
          currency?: string;
          method?: string | null;
          recipient?: string | null;
          reference?: string | null;
          receipt_url?: string | null;
          status?: string;
          verified?: boolean;
          verified_by?: string | null;
          fees?: number;
          gross_amount?: number;
          net_amount?: number;
          created_by?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_entries: {
        Row: {
          id: string;
          type: string;
          amount: number;
          currency: string;
          source: string;
          description: string | null;
          estimate_id: string | null;
          payment_id: string | null;
          payout_id: string | null;
          project_id: string | null;
          object_id: string | null;
          fees: number;
          gross_amount: number;
          net_amount: number;
          converted_amount: number | null;
          exchange_rate: number | null;
          tags_json: Json;
          receipt_url: string | null;
          reason: string | null;
          approved_by: string | null;
          requires_approval: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount?: number;
          currency?: string;
          source?: string;
          description?: string | null;
          estimate_id?: string | null;
          payment_id?: string | null;
          payout_id?: string | null;
          project_id?: string | null;
          object_id?: string | null;
          fees?: number;
          gross_amount?: number;
          net_amount?: number;
          converted_amount?: number | null;
          exchange_rate?: number | null;
          tags_json?: Json;
          receipt_url?: string | null;
          reason?: string | null;
          approved_by?: string | null;
          requires_approval?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          amount?: number;
          currency?: string;
          source?: string;
          description?: string | null;
          estimate_id?: string | null;
          payment_id?: string | null;
          payout_id?: string | null;
          project_id?: string | null;
          object_id?: string | null;
          fees?: number;
          gross_amount?: number;
          net_amount?: number;
          converted_amount?: number | null;
          exchange_rate?: number | null;
          tags_json?: Json;
          receipt_url?: string | null;
          reason?: string | null;
          approved_by?: string | null;
          requires_approval?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employee_payouts: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          object_id: string | null;
          snapshot_id: string | null;
          amount: number;
          status: string;
          paid_at: string | null;
          reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          object_id?: string | null;
          snapshot_id?: string | null;
          amount?: number;
          status?: string;
          paid_at?: string | null;
          reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          object_id?: string | null;
          snapshot_id?: string | null;
          amount?: number;
          status?: string;
          paid_at?: string | null;
          reference?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      estimate_items: {
        Row: {
          id: string | null;
          estimate_id: string | null;
          catalog_item_id: string | null;
          name: string | null;
          quantity: number | null;
          price: number | null;
          unit: string | null;
          total: number | null;
          comment: string | null;
          created_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_line_item_total: {
        Args: {
          p_discount_pct: number;
          p_labor_hours: number;
          p_labor_rate: number;
          p_markup_pct: number;
          p_quantity: number;
          p_tax_pct: number;
          p_unit_price: number;
        };
        Returns: number;
      };
      generate_estimate_number: { Args: Record<PropertyKey, never>; Returns: string };
      generate_public_token: { Args: Record<PropertyKey, never>; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      recalculate_estimate_totals: {
        Args: { p_estimate_id: string };
        Returns: undefined;
      };
      cleanup_old_rate_limits: { Args: Record<PropertyKey, never>; Returns: undefined };
    };
    Enums: {
      app_role: "guest" | "user" | "admin" | "manager" | "technician" | "super_admin";
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
        | "closed";
      line_item_type: "material" | "labor" | "service" | "other";
      request_status: "new" | "in_progress" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
