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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          service: string | null
          severity: string
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          service?: string | null
          severity?: string
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          service?: string | null
          severity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analysis_logs: {
        Row: {
          audit: Json | null
          created_at: string
          critique_score: number | null
          error: string | null
          id: string
          ip: string | null
          original_url: string | null
          project_id: string | null
          prompt_version: string | null
          referer: string | null
          rerun_count: number
          status: string
          url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          audit?: Json | null
          created_at?: string
          critique_score?: number | null
          error?: string | null
          id?: string
          ip?: string | null
          original_url?: string | null
          project_id?: string | null
          prompt_version?: string | null
          referer?: string | null
          rerun_count?: number
          status?: string
          url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          audit?: Json | null
          created_at?: string
          critique_score?: number | null
          error?: string | null
          id?: string
          ip?: string | null
          original_url?: string | null
          project_id?: string | null
          prompt_version?: string | null
          referer?: string | null
          rerun_count?: number
          status?: string
          url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_critiques: {
        Row: {
          attempt: number
          audit_id: string
          created_at: string
          id: string
          issues: Json | null
          missing: Json | null
          model: string | null
          raw: Json | null
          score: number | null
        }
        Insert: {
          attempt?: number
          audit_id: string
          created_at?: string
          id?: string
          issues?: Json | null
          missing?: Json | null
          model?: string | null
          raw?: Json | null
          score?: number | null
        }
        Update: {
          attempt?: number
          audit_id?: string
          created_at?: string
          id?: string
          issues?: Json | null
          missing?: Json | null
          model?: string | null
          raw?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_critiques_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "analysis_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_feedback: {
        Row: {
          audit_id: string
          block_ratings: Json | null
          comment: string | null
          created_at: string
          id: string
          implemented: boolean
          ip: string | null
          nps: number | null
          result_metric: string | null
          thumb: string | null
          user_agent: string | null
        }
        Insert: {
          audit_id: string
          block_ratings?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          implemented?: boolean
          ip?: string | null
          nps?: number | null
          result_metric?: string | null
          thumb?: string | null
          user_agent?: string | null
        }
        Update: {
          audit_id?: string
          block_ratings?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          implemented?: boolean
          ip?: string | null
          nps?: number | null
          result_metric?: string | null
          thumb?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_feedback_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "analysis_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_audits: {
        Row: {
          audit_payload: Json | null
          competitor_id: string
          created_at: string
          error: string | null
          extracted_price: string | null
          finished_at: string | null
          first_screen_image_url: string | null
          id: string
          model_meta: Json
          page_snapshot_hash: string | null
          project_id: string
          run_no: number
          scores: Json
          started_at: string
          status: string
          your_lens_payload: Json | null
        }
        Insert: {
          audit_payload?: Json | null
          competitor_id: string
          created_at?: string
          error?: string | null
          extracted_price?: string | null
          finished_at?: string | null
          first_screen_image_url?: string | null
          id?: string
          model_meta?: Json
          page_snapshot_hash?: string | null
          project_id: string
          run_no?: number
          scores?: Json
          started_at?: string
          status?: string
          your_lens_payload?: Json | null
        }
        Update: {
          audit_payload?: Json | null
          competitor_id?: string
          created_at?: string
          error?: string | null
          extracted_price?: string | null
          finished_at?: string | null
          first_screen_image_url?: string | null
          id?: string
          model_meta?: Json
          page_snapshot_hash?: string | null
          project_id?: string
          run_no?: number
          scores?: Json
          started_at?: string
          status?: string
          your_lens_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_audits_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_change_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          competitor_id: string
          created_at: string
          id: string
          message: string
          project_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          competitor_id: string
          created_at?: string
          id?: string
          message: string
          project_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          competitor_id?: string
          created_at?: string
          id?: string
          message?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_change_alerts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_change_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_profiles: {
        Row: {
          ai_reason: string | null
          confidence: number | null
          created_at: string
          discovered_at: string
          failure_reason: string | null
          host: string
          id: string
          is_self: boolean
          last_scanned_at: string | null
          latest_audit_id: string | null
          name: string | null
          notes: string | null
          project_id: string
          scan_interval_days: number
          screenshot_url: string | null
          source: string
          status: string
          tags: Json
          updated_at: string
          url: string
        }
        Insert: {
          ai_reason?: string | null
          confidence?: number | null
          created_at?: string
          discovered_at?: string
          failure_reason?: string | null
          host: string
          id?: string
          is_self?: boolean
          last_scanned_at?: string | null
          latest_audit_id?: string | null
          name?: string | null
          notes?: string | null
          project_id: string
          scan_interval_days?: number
          screenshot_url?: string | null
          source: string
          status?: string
          tags?: Json
          updated_at?: string
          url: string
        }
        Update: {
          ai_reason?: string | null
          confidence?: number | null
          created_at?: string
          discovered_at?: string
          failure_reason?: string | null
          host?: string
          id?: string
          is_self?: boolean
          last_scanned_at?: string | null
          latest_audit_id?: string | null
          name?: string | null
          notes?: string | null
          project_id?: string
          scan_interval_days?: number
          screenshot_url?: string | null
          source?: string
          status?: string
          tags?: Json
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          created_by: string | null
          description: string | null
          generation_id: string | null
          id: string
          metadata: Json | null
          package_id: string | null
          payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_id?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_id?: string | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_spent: number
          duration_ms: number | null
          error_message: string | null
          estimated_cost: number | null
          id: string
          input_data: Json | null
          model: string | null
          output_data: Json | null
          package_id: string | null
          payment_id: string | null
          project_id: string | null
          prompt_id: string | null
          prompt_version: number | null
          prototype_id: string | null
          quality_mark: string | null
          status: string
          tokens_used: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_spent?: number
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_data?: Json | null
          model?: string | null
          output_data?: Json | null
          package_id?: string | null
          payment_id?: string | null
          project_id?: string | null
          prompt_id?: string | null
          prompt_version?: number | null
          prototype_id?: string | null
          quality_mark?: string | null
          status?: string
          tokens_used?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_spent?: number
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_data?: Json | null
          model?: string | null
          output_data?: Json | null
          package_id?: string | null
          payment_id?: string | null
          project_id?: string | null
          prompt_id?: string | null
          prompt_version?: number | null
          prototype_id?: string | null
          quality_mark?: string | null
          status?: string
          tokens_used?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      hypotheses: {
        Row: {
          created_at: string
          description: string | null
          example_copy: string | null
          expected_impact: string | null
          id: string
          implementation_difficulty: string | null
          priority: string
          project_id: string
          source_generation_id: string | null
          source_type: string | null
          status: string
          title: string
          type: string
          updated_at: string
          what_to_change: string | null
          why: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          example_copy?: string | null
          expected_impact?: string | null
          id?: string
          implementation_difficulty?: string | null
          priority?: string
          project_id: string
          source_generation_id?: string | null
          source_type?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          what_to_change?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          example_copy?: string | null
          expected_impact?: string | null
          id?: string
          implementation_difficulty?: string | null
          priority?: string
          project_id?: string
          source_generation_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          what_to_change?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_snapshots: {
        Row: {
          artifacts: Json
          created_at: string
          error: string | null
          generated_at: string
          id: string
          included_competitor_ids: Json
          model_meta: Json
          project_id: string
          share_id: string | null
          status: string
          strategies: Json
          updated_at: string
          your_audit_id: string | null
        }
        Insert: {
          artifacts?: Json
          created_at?: string
          error?: string | null
          generated_at?: string
          id?: string
          included_competitor_ids?: Json
          model_meta?: Json
          project_id: string
          share_id?: string | null
          status?: string
          strategies?: Json
          updated_at?: string
          your_audit_id?: string | null
        }
        Update: {
          artifacts?: Json
          created_at?: string
          error?: string | null
          generated_at?: string
          id?: string
          included_competitor_ids?: Json
          model_meta?: Json
          project_id?: string
          share_id?: string | null
          status?: string
          strategies?: Json
          updated_at?: string
          your_audit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_snapshots_your_audit_id_fkey"
            columns: ["your_audit_id"]
            isOneToOne: false
            referencedRelation: "analysis_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          badge_text: string | null
          button_text: string | null
          created_at: string
          credits_amount: number
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          legal_text: string | null
          name: string
          price: number
          price_per_generation: number | null
          savings_text: string | null
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          button_text?: string | null
          created_at?: string
          credits_amount: number
          currency?: string
          description?: string | null
          features?: Json
          id: string
          is_active?: boolean
          is_popular?: boolean
          legal_text?: string | null
          name: string
          price: number
          price_per_generation?: number | null
          savings_text?: string | null
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          button_text?: string | null
          created_at?: string
          credits_amount?: number
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          legal_text?: string | null
          name?: string
          price?: number
          price_per_generation?: number | null
          savings_text?: string | null
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          internal_note: string | null
          metadata: Json | null
          package_id: string
          paid_at: string | null
          payment_provider: string | null
          provider_checkout_url: string | null
          provider_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          metadata?: Json | null
          package_id: string
          paid_at?: string | null
          payment_provider?: string | null
          provider_checkout_url?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          metadata?: Json | null
          package_id?: string
          paid_at?: string | null
          payment_provider?: string | null
          provider_checkout_url?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ideas: {
        Row: {
          admin_note: string | null
          created_at: string
          email: string | null
          id: string
          ip: string | null
          message: string
          page_path: string | null
          source: string
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          message: string
          page_path?: string | null
          source?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          message?: string
          page_path?: string | null
          source?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_login_at: string | null
          role: string
          source: string | null
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          role?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          role?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      project_contexts: {
        Row: {
          audience_segments: Json
          competitors: Json
          constraints: string | null
          created_at: string
          current_offer: string | null
          current_website_url: string | null
          desired_outcomes: Json
          id: string
          important_notes: string | null
          key_promise: string | null
          key_proofs: Json
          main_desire: string | null
          main_pain: string | null
          market_category: string | null
          missing_data: Json
          objections: Json
          positioning: string | null
          previous_attempts: string | null
          price_range: string | null
          product_description: string | null
          product_name: string | null
          project_id: string
          recommended_next_step: string | null
          secondary_pains: Json
          target_audience: string | null
          tone_of_voice: string | null
          unique_mechanism: string | null
          updated_at: string
        }
        Insert: {
          audience_segments?: Json
          competitors?: Json
          constraints?: string | null
          created_at?: string
          current_offer?: string | null
          current_website_url?: string | null
          desired_outcomes?: Json
          id?: string
          important_notes?: string | null
          key_promise?: string | null
          key_proofs?: Json
          main_desire?: string | null
          main_pain?: string | null
          market_category?: string | null
          missing_data?: Json
          objections?: Json
          positioning?: string | null
          previous_attempts?: string | null
          price_range?: string | null
          product_description?: string | null
          product_name?: string | null
          project_id: string
          recommended_next_step?: string | null
          secondary_pains?: Json
          target_audience?: string | null
          tone_of_voice?: string | null
          unique_mechanism?: string | null
          updated_at?: string
        }
        Update: {
          audience_segments?: Json
          competitors?: Json
          constraints?: string | null
          created_at?: string
          current_offer?: string | null
          current_website_url?: string | null
          desired_outcomes?: Json
          id?: string
          important_notes?: string | null
          key_promise?: string | null
          key_proofs?: Json
          main_desire?: string | null
          main_pain?: string | null
          market_category?: string | null
          missing_data?: Json
          objections?: Json
          positioning?: string | null
          previous_attempts?: string | null
          price_range?: string | null
          product_description?: string | null
          product_name?: string | null
          project_id?: string
          recommended_next_step?: string | null
          secondary_pains?: Json
          target_audience?: string | null
          tone_of_voice?: string | null
          unique_mechanism?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contexts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          extracted_text: string | null
          extraction_error: string | null
          extraction_status: string
          id: string
          mime_type: string
          original_filename: string
          project_id: string
          size_bytes: number
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: string
          id?: string
          mime_type?: string
          original_filename: string
          project_id: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: string
          id?: string
          mime_type?: string
          original_filename?: string
          project_id?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_insights: {
        Row: {
          confidence: string
          created_at: string
          description: string | null
          evidence: string | null
          id: string
          insight_type: string
          is_applied: boolean
          project_id: string
          source_id: string | null
          source_type: string
          title: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          insight_type: string
          is_applied?: boolean
          project_id: string
          source_id?: string | null
          source_type: string
          title: string
        }
        Update: {
          confidence?: string
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          insight_type?: string
          is_applied?: boolean
          project_id?: string
          source_id?: string | null
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_plans: {
        Row: {
          created_at: string
          deadline: string | null
          focus: string | null
          goal: string | null
          horizon: string
          id: string
          north_star_metric_id: string | null
          project_id: string
          strategies: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          focus?: string | null
          goal?: string | null
          horizon?: string
          id?: string
          north_star_metric_id?: string | null
          project_id: string
          strategies?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          focus?: string | null
          goal?: string | null
          horizon?: string
          id?: string
          north_star_metric_id?: string | null
          project_id?: string
          strategies?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_plans_north_star_metric_id_fkey"
            columns: ["north_star_metric_id"]
            isOneToOne: false
            referencedRelation: "commercial_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memories: {
        Row: {
          audience: Json
          badges: Json
          business_metrics: Json
          company: Json
          competitors: Json
          completion_level: string
          completion_percent: number
          constraints: Json
          created_at: string
          founder: Json
          id: string
          objections: Json
          offer_positioning: Json
          pains_desires: Json
          pricing: Json
          product: Json
          project_id: string
          proofs: Json
          tone: Json
          updated_at: string
          websites: Json
        }
        Insert: {
          audience?: Json
          badges?: Json
          business_metrics?: Json
          company?: Json
          competitors?: Json
          completion_level?: string
          completion_percent?: number
          constraints?: Json
          created_at?: string
          founder?: Json
          id?: string
          objections?: Json
          offer_positioning?: Json
          pains_desires?: Json
          pricing?: Json
          product?: Json
          project_id: string
          proofs?: Json
          tone?: Json
          updated_at?: string
          websites?: Json
        }
        Update: {
          audience?: Json
          badges?: Json
          business_metrics?: Json
          company?: Json
          competitors?: Json
          completion_level?: string
          completion_percent?: number
          constraints?: Json
          created_at?: string
          founder?: Json
          id?: string
          objections?: Json
          offer_positioning?: Json
          pains_desires?: Json
          pricing?: Json
          product?: Json
          project_id?: string
          proofs?: Json
          tone?: Json
          updated_at?: string
          websites?: Json
        }
        Relationships: [
          {
            foreignKeyName: "project_memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memory_updates: {
        Row: {
          applied_at: string | null
          created_at: string
          field: string
          id: string
          old_value: Json | null
          project_id: string
          section: string
          source_id: string | null
          source_type: string
          status: string
          suggested_value: Json
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          field: string
          id?: string
          old_value?: Json | null
          project_id: string
          section: string
          source_id?: string | null
          source_type: string
          status?: string
          suggested_value: Json
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          field?: string
          id?: string
          old_value?: Json | null
          project_id?: string
          section?: string
          source_id?: string | null
          source_type?: string
          status?: string
          suggested_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "project_memory_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          additional_context: string | null
          competitors: Json
          created_at: string
          current_offer: string | null
          current_website_url: string | null
          id: string
          idea_lab_state: Json
          last_activity_at: string
          main_goal: string
          name: string
          onboarding_completed_at: string | null
          onboarding_state: Json
          packaging_score: number | null
          product_description: string
          product_name: string | null
          quiz_answers_snapshot: Json | null
          quiz_completed: boolean
          quiz_memory_mapped_fields: string[] | null
          quiz_synced_at: string | null
          startup_mode: string
          status: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          competitors?: Json
          created_at?: string
          current_offer?: string | null
          current_website_url?: string | null
          id?: string
          idea_lab_state?: Json
          last_activity_at?: string
          main_goal: string
          name: string
          onboarding_completed_at?: string | null
          onboarding_state?: Json
          packaging_score?: number | null
          product_description: string
          product_name?: string | null
          quiz_answers_snapshot?: Json | null
          quiz_completed?: boolean
          quiz_memory_mapped_fields?: string[] | null
          quiz_synced_at?: string | null
          startup_mode?: string
          status?: string
          target_audience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_context?: string | null
          competitors?: Json
          created_at?: string
          current_offer?: string | null
          current_website_url?: string | null
          id?: string
          idea_lab_state?: Json
          last_activity_at?: string
          main_goal?: string
          name?: string
          onboarding_completed_at?: string | null
          onboarding_state?: Json
          packaging_score?: number | null
          product_description?: string
          product_name?: string | null
          quiz_answers_snapshot?: Json | null
          quiz_completed?: boolean
          quiz_memory_mapped_fields?: string[] | null
          quiz_synced_at?: string | null
          startup_mode?: string
          status?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          bad_results: number
          created_at: string
          description: string | null
          good_results: number
          id: string
          is_active: boolean
          is_test: boolean
          name: string
          output_format: string | null
          system_prompt: string | null
          type: string
          updated_at: string
          user_prompt_template: string | null
          uses_count: number
          variables: Json | null
          version: number
        }
        Insert: {
          bad_results?: number
          created_at?: string
          description?: string | null
          good_results?: number
          id?: string
          is_active?: boolean
          is_test?: boolean
          name: string
          output_format?: string | null
          system_prompt?: string | null
          type: string
          updated_at?: string
          user_prompt_template?: string | null
          uses_count?: number
          variables?: Json | null
          version?: number
        }
        Update: {
          bad_results?: number
          created_at?: string
          description?: string | null
          good_results?: number
          id?: string
          is_active?: boolean
          is_test?: boolean
          name?: string
          output_format?: string | null
          system_prompt?: string | null
          type?: string
          updated_at?: string
          user_prompt_template?: string | null
          uses_count?: number
          variables?: Json | null
          version?: number
        }
        Relationships: []
      }
      prototypes: {
        Row: {
          anonymous_demo: boolean
          brief: Json
          content: Json | null
          created_at: string
          creator_ip: string | null
          error: string | null
          id: string
          project_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_demo?: boolean
          brief: Json
          content?: Json | null
          created_at?: string
          creator_ip?: string | null
          error?: string | null
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_demo?: boolean
          brief?: Json
          content?: Json | null
          created_at?: string
          creator_ip?: string | null
          error?: string | null
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototypes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          available_for_packages: Json | null
          category: string
          created_at: string
          credits_cost: number
          description: string | null
          form_schema: Json | null
          id: string
          is_active: boolean
          name: string
          output_type: string | null
          prompt_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          available_for_packages?: Json | null
          category: string
          created_at?: string
          credits_cost?: number
          description?: string | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean
          name: string
          output_type?: string | null
          prompt_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available_for_packages?: Json | null
          category?: string
          created_at?: string
          credits_cost?: number
          description?: string | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          output_type?: string | null
          prompt_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          total_purchased: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          note: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_metadata?: Json
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      admin_adjust_credits: {
        Args: {
          p_admin_id: string
          p_amount: number
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      deduct_credit: {
        Args: { p_prototype_id: string; p_user_id: string }
        Returns: boolean
      }
      handle_successful_payment: {
        Args: { p_admin_id?: string; p_payment_id: string }
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
    Enums: {},
  },
} as const
