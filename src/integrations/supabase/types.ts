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
      life_saving_rules: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      safety_analyses: {
        Row: {
          activity: string
          barrier_failure: string
          created_at: string
          evidence: Json
          explanation: string
          hazard: string
          id: string
          life_saving_rule: string
          location: string
          model: string
          potential_consequence: string
          recommended_focus: string
          report_id: string
          review_priority: string
          sif_level: string
          sif_potential: boolean
          suggested_action: string
          unsafe_act_condition: string
          updated_at: string
          why_flagged: string
        }
        Insert: {
          activity?: string
          barrier_failure?: string
          created_at?: string
          evidence?: Json
          explanation?: string
          hazard?: string
          id?: string
          life_saving_rule?: string
          location?: string
          model?: string
          potential_consequence?: string
          recommended_focus?: string
          report_id: string
          review_priority?: string
          sif_level?: string
          sif_potential: boolean
          suggested_action?: string
          unsafe_act_condition?: string
          updated_at?: string
          why_flagged?: string
        }
        Update: {
          activity?: string
          barrier_failure?: string
          created_at?: string
          evidence?: Json
          explanation?: string
          hazard?: string
          id?: string
          life_saving_rule?: string
          location?: string
          model?: string
          potential_consequence?: string
          recommended_focus?: string
          report_id?: string
          review_priority?: string
          sif_level?: string
          sif_potential?: boolean
          suggested_action?: string
          unsafe_act_condition?: string
          updated_at?: string
          why_flagged?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_analyses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "safety_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          activity: string
          created_at: string
          department: string
          description: string
          id: string
          report_date: string
          report_id: string
          report_type: string
          site: string
          updated_at: string
        }
        Insert: {
          activity: string
          created_at?: string
          department?: string
          description: string
          id?: string
          report_date: string
          report_id: string
          report_type: string
          site: string
          updated_at?: string
        }
        Update: {
          activity?: string
          created_at?: string
          department?: string
          description?: string
          id?: string
          report_date?: string
          report_id?: string
          report_type?: string
          site?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_reviews: {
        Row: {
          assigned_action: string
          classification: string
          comment: string
          corrected_rule: string
          created_at: string
          id: string
          report_id: string
          reviewed_at: string
          reviewed_by: string
          status: string
        }
        Insert: {
          assigned_action?: string
          classification: string
          comment?: string
          corrected_rule?: string
          created_at?: string
          id?: string
          report_id: string
          reviewed_at?: string
          reviewed_by?: string
          status?: string
        }
        Update: {
          assigned_action?: string
          classification?: string
          comment?: string
          corrected_rule?: string
          created_at?: string
          id?: string
          report_id?: string
          reviewed_at?: string
          reviewed_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_reviews_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "safety_reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
