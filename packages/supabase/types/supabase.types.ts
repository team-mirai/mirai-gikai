export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bill_contents: {
        Row: {
          bill_id: string
          content: string
          created_at: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          bill_id: string
          content: string
          created_at?: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          bill_id?: string
          content?: string
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_contents_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          created_at: string
          diet_session_id: string | null
          id: string
          is_featured: boolean
          name: string
          originating_house: Database["public"]["Enums"]["house_enum"]
          publish_status: Database["public"]["Enums"]["bill_publish_status"]
          published_at: string | null
          share_thumbnail_url: string | null
          shugiin_url: string | null
          status: Database["public"]["Enums"]["bill_status_enum"]
          status_note: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_session_id?: string | null
          id?: string
          is_featured?: boolean
          name: string
          originating_house: Database["public"]["Enums"]["house_enum"]
          publish_status?: Database["public"]["Enums"]["bill_publish_status"]
          published_at?: string | null
          share_thumbnail_url?: string | null
          shugiin_url?: string | null
          status: Database["public"]["Enums"]["bill_status_enum"]
          status_note?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_session_id?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          originating_house?: Database["public"]["Enums"]["house_enum"]
          publish_status?: Database["public"]["Enums"]["bill_publish_status"]
          published_at?: string | null
          share_thumbnail_url?: string | null
          shugiin_url?: string | null
          status?: Database["public"]["Enums"]["bill_status_enum"]
          status_note?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_diet_session_id_fkey"
            columns: ["diet_session_id"]
            isOneToOne: false
            referencedRelation: "diet_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bills_tags: {
        Row: {
          bill_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_tags_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage_events: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          metadata: Json | null
          model: string
          occurred_at: string
          output_tokens: number
          prompt_name: string | null
          session_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model: string
          occurred_at?: string
          output_tokens?: number
          prompt_name?: string | null
          session_id?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string
          occurred_at?: string
          output_tokens?: number
          prompt_name?: string | null
          session_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          message: string
          role: Database["public"]["Enums"]["chat_role_enum"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          message: string
          role: Database["public"]["Enums"]["chat_role_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          message?: string
          role?: Database["public"]["Enums"]["chat_role_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_sessions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          shugiin_url: string | null
          slug: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          shugiin_url?: string | null
          slug?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          shugiin_url?: string | null
          slug?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      expert_registrations: {
        Row: {
          affiliation: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliation: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliation?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_configs: {
        Row: {
          bill_id: string
          chat_model: string | null
          created_at: string
          estimated_duration: number | null
          id: string
          knowledge_source: string | null
          mode: Database["public"]["Enums"]["interview_mode_enum"]
          name: string
          status: Database["public"]["Enums"]["interview_config_status_enum"]
          themes: string[] | null
          updated_at: string
        }
        Insert: {
          bill_id: string
          chat_model?: string | null
          created_at?: string
          estimated_duration?: number | null
          id?: string
          knowledge_source?: string | null
          mode?: Database["public"]["Enums"]["interview_mode_enum"]
          name: string
          status?: Database["public"]["Enums"]["interview_config_status_enum"]
          themes?: string[] | null
          updated_at?: string
        }
        Update: {
          bill_id?: string
          chat_model?: string | null
          created_at?: string
          estimated_duration?: number | null
          id?: string
          knowledge_source?: string | null
          mode?: Database["public"]["Enums"]["interview_mode_enum"]
          name?: string
          status?: Database["public"]["Enums"]["interview_config_status_enum"]
          themes?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_configs_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          interview_session_id: string
          role: Database["public"]["Enums"]["interview_role_enum"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          interview_session_id: string
          role: Database["public"]["Enums"]["interview_role_enum"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          interview_session_id?: string
          role?: Database["public"]["Enums"]["interview_role_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string
          follow_up_guide: string | null
          id: string
          interview_config_id: string
          question: string
          question_order: number
          quick_replies: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_guide?: string | null
          id?: string
          interview_config_id: string
          question: string
          question_order: number
          quick_replies?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_guide?: string | null
          id?: string
          interview_config_id?: string
          question?: string
          question_order?: number
          quick_replies?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_interview_config_id_fkey"
            columns: ["interview_config_id"]
            isOneToOne: false
            referencedRelation: "interview_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_report: {
        Row: {
          created_at: string
          id: string
          interview_session_id: string
          is_public_by_admin: boolean
          opinions: Json | null
          role: Database["public"]["Enums"]["interview_report_role_enum"] | null
          role_description: string | null
          role_title: string | null
          scores: Json | null
          stance: Database["public"]["Enums"]["stance_type_enum"] | null
          summary: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_session_id: string
          is_public_by_admin?: boolean
          opinions?: Json | null
          role?:
            | Database["public"]["Enums"]["interview_report_role_enum"]
            | null
          role_description?: string | null
          role_title?: string | null
          scores?: Json | null
          stance?: Database["public"]["Enums"]["stance_type_enum"] | null
          summary?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_session_id?: string
          is_public_by_admin?: boolean
          opinions?: Json | null
          role?:
            | Database["public"]["Enums"]["interview_report_role_enum"]
            | null
          role_description?: string | null
          role_title?: string | null
          scores?: Json | null
          stance?: Database["public"]["Enums"]["stance_type_enum"] | null
          summary?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_report_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: true
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          interview_config_id: string
          is_public_by_user: boolean
          langfuse_session_id: string | null
          rating: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_config_id: string
          is_public_by_user?: boolean
          langfuse_session_id?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_config_id?: string
          is_public_by_user?: boolean
          langfuse_session_id?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_interview_config_id_fkey"
            columns: ["interview_config_id"]
            isOneToOne: false
            referencedRelation: "interview_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      mirai_stances: {
        Row: {
          bill_id: string
          comment: string | null
          created_at: string
          id: string
          type: Database["public"]["Enums"]["stance_type_enum"]
          updated_at: string
        }
        Insert: {
          bill_id: string
          comment?: string | null
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["stance_type_enum"]
          updated_at?: string
        }
        Update: {
          bill_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["stance_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mirai_stances_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_tokens: {
        Row: {
          bill_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_tokens_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          featured_priority: number | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured_priority?: number | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured_priority?: number | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_interview_message_counts: {
        Args: { session_ids: string[] }
        Returns: {
          interview_session_id: string
          message_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      set_active_diet_session: {
        Args: { target_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      bill_publish_status: "draft" | "published" | "coming_soon"
      bill_status_enum:
        | "introduced"
        | "in_originating_house"
        | "in_receiving_house"
        | "enacted"
        | "rejected"
        | "preparing"
      chat_role_enum: "user" | "system" | "assistant"
      difficulty_level_enum: "normal" | "hard"
      house_enum: "HR" | "HC"
      interview_config_status_enum: "public" | "closed"
      interview_mode_enum: "loop" | "bulk"
      interview_report_role_enum:
        | "subject_expert"
        | "work_related"
        | "daily_life_affected"
        | "general_citizen"
      interview_role_enum: "assistant" | "user"
      stance_type_enum:
        | "for"
        | "against"
        | "neutral"
        | "conditional_for"
        | "conditional_against"
        | "considering"
        | "continued_deliberation"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bill_publish_status: ["draft", "published", "coming_soon"],
      bill_status_enum: [
        "introduced",
        "in_originating_house",
        "in_receiving_house",
        "enacted",
        "rejected",
        "preparing",
      ],
      chat_role_enum: ["user", "system", "assistant"],
      difficulty_level_enum: ["normal", "hard"],
      house_enum: ["HR", "HC"],
      interview_config_status_enum: ["public", "closed"],
      interview_mode_enum: ["loop", "bulk"],
      interview_report_role_enum: [
        "subject_expert",
        "work_related",
        "daily_life_affected",
        "general_citizen",
      ],
      interview_role_enum: ["assistant", "user"],
      stance_type_enum: [
        "for",
        "against",
        "neutral",
        "conditional_for",
        "conditional_against",
        "considering",
        "continued_deliberation",
      ],
    },
  },
} as const

