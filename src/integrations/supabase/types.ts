export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          email: string
          role: Database['public']['Enums']['user_role']
          avatar_url: string | null
          phone: string | null
          address: string | null
          notification_preferences: Json | null
          is_active: boolean
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          email: string
          role?: Database['public']['Enums']['user_role']
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          notification_preferences?: Json | null
          is_active?: boolean
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          email?: string
          role?: Database['public']['Enums']['user_role']
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          notification_preferences?: Json | null
          is_active?: boolean
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          location_lat: number
          location_lng: number
          address: string | null
          status: Database['public']['Enums']['incident_status']
          priority: Database['public']['Enums']['incident_priority']
          reporter_id: string | null
          assigned_to: string | null
          assigned_by: string | null
          assigned_at: string | null
          category: string | null
          tags: string[] | null
          is_anonymous: boolean
          is_verified: boolean
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location_lat: number
          location_lng: number
          address?: string | null
          status?: Database['public']['Enums']['incident_status']
          priority?: Database['public']['Enums']['incident_priority']
          reporter_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_at?: string | null
          category?: string | null
          tags?: string[] | null
          is_anonymous?: boolean
          is_verified?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location_lat?: number
          location_lng?: number
          address?: string | null
          status?: Database['public']['Enums']['incident_status']
          priority?: Database['public']['Enums']['incident_priority']
          reporter_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_at?: string | null
          category?: string | null
          tags?: string[] | null
          is_anonymous?: boolean
          is_verified?: boolean
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      incident_assignments: {
        Row: {
          id: string
          incident_id: string
          assigned_to: string
          assigned_by: string
          assigned_at: string
          notes: string | null
          status: Database['public']['Enums']['incident_status']
        }
        Insert: {
          id?: string
          incident_id: string
          assigned_to: string
          assigned_by: string
          assigned_at?: string
          notes?: string | null
          status?: Database['public']['Enums']['incident_status']
        }
        Update: {
          id?: string
          incident_id?: string
          assigned_to?: string
          assigned_by?: string
          assigned_at?: string
          notes?: string | null
          status?: Database['public']['Enums']['incident_status']
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      incident_feedback: {
        Row: {
          id: string
          incident_id: string
          security_id: string
          feedback_text: string
          status: Database['public']['Enums']['feedback_status']
          submitted_at: string
          approved_by: string | null
          approved_at: string | null
          approved_by_reporter: boolean
          reporter_approved_at: string | null
          admin_approved_at: string | null
          admin_approved_by: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          security_id: string
          feedback_text: string
          status?: Database['public']['Enums']['feedback_status']
          submitted_at?: string
          approved_by?: string | null
          approved_at?: string | null
          approved_by_reporter?: boolean
          reporter_approved_at?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          security_id?: string
          feedback_text?: string
          status?: Database['public']['Enums']['feedback_status']
          submitted_at?: string
          approved_by?: string | null
          approved_at?: string | null
          approved_by_reporter?: boolean
          reporter_approved_at?: string | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_feedback_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_feedback_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_feedback_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_feedback_admin_approved_by_fkey"
            columns: ["admin_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      incident_photos: {
        Row: {
          id: string
          incident_id: string
          photo_url: string
          file_name: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          photo_url: string
          file_name?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          photo_url?: string
          file_name?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          incident_id: string
          user_id: string
          content: string
          is_internal: boolean
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          user_id: string
          content: string
          is_internal?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          user_id?: string
          content?: string
          is_internal?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          incident_id: string | null
          type: Database['public']['Enums']['notification_type']
          title: string
          message: string
          is_read: boolean
          priority: number
          action_required: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          incident_id?: string | null
          type: Database['public']['Enums']['notification_type']
          title: string
          message: string
          is_read?: boolean
          priority?: number
          action_required?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          incident_id?: string | null
          type?: Database['public']['Enums']['notification_type']
          title?: string
          message?: string
          is_read?: boolean
          priority?: number
          action_required?: boolean
          action_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: unknown | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: unknown | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: unknown | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cube: {
        Args: { "": number[] } | { "": number }
        Returns: unknown
      }
      cube_dim: {
        Args: { "": unknown }
        Returns: number
      }
      cube_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      cube_is_point: {
        Args: { "": unknown }
        Returns: boolean
      }
      cube_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      cube_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      cube_send: {
        Args: { "": unknown }
        Returns: unknown
      }
      cube_size: {
        Args: { "": unknown }
        Returns: number
      }
      earth: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      gc_to_sec: {
        Args: { "": number }
        Returns: number
      }
      latitude: {
        Args: { "": unknown }
        Returns: number
      }
      longitude: {
        Args: { "": unknown }
        Returns: number
      }
      sec_to_gc: {
        Args: { "": number }
        Returns: number
      }
    }
    Enums: {
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status:
        | "reported"
        | "assigned"
        | "in_progress"
        | "feedback_pending"
        | "feedback_submitted"
        | "feedback_approved"
        | "resolved"
        | "closed"
      notification_type:
        | "incident_created"
        | "incident_assigned"
        | "incident_updated"
        | "status_changed"
        | "comment_added"
        | "feedback_submitted"
        | "feedback_approved"
        | "incident_resolved"
      user_role: "resident" | "admin" | "super_admin" | "security"
      feedback_status: "pending" | "submitted" | "approved" | "rejected"
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
      incident_priority: ["low", "medium", "high", "critical"],
      incident_status: [
        "reported",
        "assigned",
        "in_progress",
        "feedback_pending",
        "feedback_submitted",
        "feedback_approved",
        "resolved",
        "closed",
      ],
      notification_type: [
        "incident_created",
        "incident_assigned",
        "incident_updated",
        "status_changed",
        "comment_added",
        "feedback_submitted",
        "feedback_approved",
        "incident_resolved",
      ],
      user_role: ["resident", "admin", "super_admin", "security"],
      feedback_status: ["pending", "submitted", "approved", "rejected"],
    },
  },
} as const
