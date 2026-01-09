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
      api_calls: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          processing_time_ms: number | null
          request_body: Json | null
          response_body: Json | null
          status_code: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown
          method: string
          processing_time_ms?: number | null
          request_body?: Json | null
          response_body?: Json | null
          status_code: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          processing_time_ms?: number | null
          request_body?: Json | null
          response_body?: Json | null
          status_code?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_calls_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          rate_limit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          rate_limit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          rate_limit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          commercial_indicators: Json | null
          composite_score: number | null
          created_at: string
          data_sources: string[] | null
          engagement_capacity: number | null
          enrichment_count: number | null
          external_reference: string
          financial_indicators: Json | null
          id: string
          identity_data: Json | null
          last_enriched_at: string | null
          partner_id: string
          reliability_score: number | null
          risk_score: number | null
          stability_indicators: Json | null
          stability_score: number | null
          telecom_indicators: Json | null
          updated_at: string
        }
        Insert: {
          commercial_indicators?: Json | null
          composite_score?: number | null
          created_at?: string
          data_sources?: string[] | null
          engagement_capacity?: number | null
          enrichment_count?: number | null
          external_reference: string
          financial_indicators?: Json | null
          id?: string
          identity_data?: Json | null
          last_enriched_at?: string | null
          partner_id: string
          reliability_score?: number | null
          risk_score?: number | null
          stability_indicators?: Json | null
          stability_score?: number | null
          telecom_indicators?: Json | null
          updated_at?: string
        }
        Update: {
          commercial_indicators?: Json | null
          composite_score?: number | null
          created_at?: string
          data_sources?: string[] | null
          engagement_capacity?: number | null
          enrichment_count?: number | null
          external_reference?: string
          financial_indicators?: Json | null
          id?: string
          identity_data?: Json | null
          last_enriched_at?: string | null
          partner_id?: string
          reliability_score?: number | null
          risk_score?: number | null
          stability_indicators?: Json | null
          stability_score?: number | null
          telecom_indicators?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_consents: {
        Row: {
          consent_expires_at: string | null
          consent_given_at: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          mobile_money_consent: boolean | null
          phone_number: string
          registry_consent: boolean | null
          session_id: string | null
          telecom_consent: boolean | null
          user_id: string | null
          utility_consent: boolean | null
        }
        Insert: {
          consent_expires_at?: string | null
          consent_given_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mobile_money_consent?: boolean | null
          phone_number: string
          registry_consent?: boolean | null
          session_id?: string | null
          telecom_consent?: boolean | null
          user_id?: string | null
          utility_consent?: boolean | null
        }
        Update: {
          consent_expires_at?: string | null
          consent_given_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mobile_money_consent?: boolean | null
          phone_number?: string
          registry_consent?: boolean | null
          session_id?: string | null
          telecom_consent?: boolean | null
          user_id?: string | null
          utility_consent?: boolean | null
        }
        Relationships: []
      }
      data_enrichments: {
        Row: {
          confidence_score: number | null
          consent_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          is_simulated: boolean | null
          normalized_data: Json | null
          processing_time_ms: number | null
          raw_data: Json
          scoring_request_id: string | null
          source_provider: string
          source_type: string
          verification_status: string | null
        }
        Insert: {
          confidence_score?: number | null
          consent_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_simulated?: boolean | null
          normalized_data?: Json | null
          processing_time_ms?: number | null
          raw_data?: Json
          scoring_request_id?: string | null
          source_provider: string
          source_type: string
          verification_status?: string | null
        }
        Update: {
          confidence_score?: number | null
          consent_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_simulated?: boolean | null
          normalized_data?: Json | null
          processing_time_ms?: number | null
          raw_data?: Json
          scoring_request_id?: string | null
          source_provider?: string
          source_type?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_enrichments_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "data_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_enrichments_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_credentials: {
        Row: {
          api_endpoint: string | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_sandbox: boolean | null
          provider: string
          rate_limit_per_minute: number | null
          sandbox_endpoint: string | null
          source_type: string
          supported_countries: string[] | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          provider: string
          rate_limit_per_minute?: number | null
          sandbox_endpoint?: string | null
          source_type: string
          supported_countries?: string[] | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          provider?: string
          rate_limit_per_minute?: number | null
          sandbox_endpoint?: string | null
          source_type?: string
          supported_countries?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dataset_rows: {
        Row: {
          confidence: number | null
          created_at: string
          data: Json
          dataset_id: string
          error_message: string | null
          id: string
          processed_at: string | null
          risk_category: string | null
          row_number: number
          score: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          data: Json
          dataset_id: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          risk_category?: string | null
          row_number: number
          score?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          data?: Json
          dataset_id?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          risk_category?: string | null
          row_number?: number
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          column_count: number | null
          columns: Json | null
          created_at: string
          description: string | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          name: string
          processing_progress: number | null
          row_count: number | null
          scores_calculated: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name: string
          processing_progress?: number | null
          row_count?: number | null
          scores_calculated?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name?: string
          processing_progress?: number | null
          row_count?: number | null
          scores_calculated?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fraud_detections: {
        Row: {
          anomalies_count: number | null
          behavior_coherence: number | null
          created_at: string
          flags: Json | null
          fraud_score: number | null
          full_name: string | null
          id: string
          identity_coherence: number | null
          national_id: string | null
          partner_id: string
          phone_number: string | null
          processing_time_ms: number | null
          profile_id: string | null
          risk_level: string | null
        }
        Insert: {
          anomalies_count?: number | null
          behavior_coherence?: number | null
          created_at?: string
          flags?: Json | null
          fraud_score?: number | null
          full_name?: string | null
          id?: string
          identity_coherence?: number | null
          national_id?: string | null
          partner_id: string
          phone_number?: string | null
          processing_time_ms?: number | null
          profile_id?: string | null
          risk_level?: string | null
        }
        Update: {
          anomalies_count?: number | null
          behavior_coherence?: number | null
          created_at?: string
          flags?: Json | null
          fraud_score?: number | null
          full_name?: string | null
          id?: string
          identity_coherence?: number | null
          national_id?: string | null
          partner_id?: string
          phone_number?: string | null
          processing_time_ms?: number | null
          profile_id?: string | null
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_detections_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_detections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string
          metadata: Json | null
          paid_at: string | null
          pdf_url: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          metadata?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          metadata?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          ocr_confidence: number | null
          ocr_data: Json | null
          rejection_reason: string | null
          status: string | null
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      kyc_validations: {
        Row: {
          address_verified: boolean | null
          assigned_analyst: string | null
          completed_at: string | null
          created_at: string
          documents_complete: boolean | null
          id: string
          identity_verified: boolean | null
          income_verified: boolean | null
          notes: string | null
          overall_score: number | null
          risk_flags: string[] | null
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_verified?: boolean | null
          assigned_analyst?: string | null
          completed_at?: string | null
          created_at?: string
          documents_complete?: boolean | null
          id?: string
          identity_verified?: boolean | null
          income_verified?: boolean | null
          notes?: string | null
          overall_score?: number | null
          risk_flags?: string[] | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_verified?: boolean | null
          assigned_analyst?: string | null
          completed_at?: string | null
          created_at?: string
          documents_complete?: boolean | null
          id?: string
          identity_verified?: boolean | null
          income_verified?: boolean | null
          notes?: string | null
          overall_score?: number | null
          risk_flags?: string[] | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monitoring_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          is_acknowledged: boolean | null
          message: string
          monitoring_id: string
          partner_id: string
          profile_id: string
          severity: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          message: string
          monitoring_id: string
          partner_id: string
          profile_id: string
          severity?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          message?: string
          monitoring_id?: string
          partner_id?: string
          profile_id?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_monitoring_id_fkey"
            columns: ["monitoring_id"]
            isOneToOne: false
            referencedRelation: "profile_monitoring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_billing: {
        Row: {
          api_calls_count: number | null
          created_at: string
          currency: string | null
          id: string
          identity_requests_count: number | null
          kyc_requests_count: number | null
          paid_at: string | null
          period_end: string
          period_start: string
          score_requests_count: number | null
          status: string | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          identity_requests_count?: number | null
          kyc_requests_count?: number | null
          paid_at?: string | null
          period_end: string
          period_start: string
          score_requests_count?: number | null
          status?: string | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          identity_requests_count?: number | null
          kyc_requests_count?: number | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          score_requests_count?: number | null
          status?: string | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          cinetpay_data: Json | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          payment_token: string | null
          payment_url: string | null
          plan_id: string | null
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cinetpay_data?: Json | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_token?: string | null
          payment_url?: string | null
          plan_id?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cinetpay_data?: Json | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_token?: string | null
          payment_url?: string | null
          plan_id?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      precheck_requests: {
        Row: {
          api_key_id: string | null
          created_at: string
          full_name: string
          id: string
          partner_id: string
          phone_number: string
          processing_time_ms: number | null
          quick_score: number | null
          sim_stability: string | null
          status: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          partner_id: string
          phone_number: string
          processing_time_ms?: number | null
          quick_score?: number | null
          sim_stability?: string | null
          status?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          partner_id?: string
          phone_number?: string
          processing_time_ms?: number | null
          quick_score?: number | null
          sim_stability?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precheck_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precheck_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_monitoring: {
        Row: {
          alert_count: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_alert_at: string | null
          last_check_at: string | null
          monitoring_type: string
          partner_id: string
          profile_id: string
          threshold_config: Json | null
          updated_at: string
        }
        Insert: {
          alert_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_alert_at?: string | null
          last_check_at?: string | null
          monitoring_type: string
          partner_id: string
          profile_id: string
          threshold_config?: Json | null
          updated_at?: string
        }
        Update: {
          alert_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_alert_at?: string | null
          last_check_at?: string | null
          monitoring_type?: string
          partner_id?: string
          profile_id?: string
          threshold_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_monitoring_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_monitoring_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          granted_at?: string
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          granted_at?: string
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_requests: {
        Row: {
          city: string | null
          company_name: string | null
          confidence: number | null
          created_at: string
          customer_profile_id: string | null
          employment_type: string | null
          engagement_capacity_score: number | null
          error_message: string | null
          existing_loans: number | null
          explanations: Json | null
          feature_importance: Json | null
          full_name: string | null
          grade: string | null
          id: string
          mobile_money_transactions: number | null
          mobile_money_volume: number | null
          model_version: string | null
          monthly_expenses: number | null
          monthly_income: number | null
          national_id: string | null
          phone_number: string | null
          processing_time_ms: number | null
          rccm_number: string | null
          recommendations: Json | null
          region: string | null
          reliability_score: number | null
          risk_category: string | null
          score: number | null
          sector: string | null
          short_term_risk: number | null
          sim_age_months: number | null
          stability_score: number | null
          status: string | null
          updated_at: string
          user_id: string | null
          utility_payments_late: number | null
          utility_payments_on_time: number | null
          years_in_business: number | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          confidence?: number | null
          created_at?: string
          customer_profile_id?: string | null
          employment_type?: string | null
          engagement_capacity_score?: number | null
          error_message?: string | null
          existing_loans?: number | null
          explanations?: Json | null
          feature_importance?: Json | null
          full_name?: string | null
          grade?: string | null
          id?: string
          mobile_money_transactions?: number | null
          mobile_money_volume?: number | null
          model_version?: string | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          national_id?: string | null
          phone_number?: string | null
          processing_time_ms?: number | null
          rccm_number?: string | null
          recommendations?: Json | null
          region?: string | null
          reliability_score?: number | null
          risk_category?: string | null
          score?: number | null
          sector?: string | null
          short_term_risk?: number | null
          sim_age_months?: number | null
          stability_score?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          utility_payments_late?: number | null
          utility_payments_on_time?: number | null
          years_in_business?: number | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          confidence?: number | null
          created_at?: string
          customer_profile_id?: string | null
          employment_type?: string | null
          engagement_capacity_score?: number | null
          error_message?: string | null
          existing_loans?: number | null
          explanations?: Json | null
          feature_importance?: Json | null
          full_name?: string | null
          grade?: string | null
          id?: string
          mobile_money_transactions?: number | null
          mobile_money_volume?: number | null
          model_version?: string | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          national_id?: string | null
          phone_number?: string | null
          processing_time_ms?: number | null
          rccm_number?: string | null
          recommendations?: Json | null
          region?: string | null
          reliability_score?: number | null
          risk_category?: string | null
          score?: number | null
          sector?: string | null
          short_term_risk?: number | null
          sim_age_months?: number | null
          stability_score?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          utility_payments_late?: number | null
          utility_payments_on_time?: number | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_requests_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          category: string
          created_at: string
          id: string
          is_system: boolean | null
          key: string
          updated_at: string
          user_id: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          key: string
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_system?: boolean | null
          key?: string
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          metadata: Json | null
          plan_id: string | null
          status: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_activity: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          retry_count: number | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          retry_count?: number | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          retry_count?: number | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "SUPER_ADMIN" | "ANALYSTE" | "ENTREPRISE" | "API_CLIENT"
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
      app_role: ["SUPER_ADMIN", "ANALYSTE", "ENTREPRISE", "API_CLIENT"],
    },
  },
} as const
