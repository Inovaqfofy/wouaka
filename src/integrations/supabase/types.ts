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
      ab_experiments: {
        Row: {
          control_default_rate: number | null
          control_model_version_id: string | null
          control_outcomes: number | null
          control_requests: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ended_at: string | null
          hypothesis: string | null
          id: string
          min_sample_size: number | null
          name: string
          started_at: string | null
          statistical_significance: number | null
          status: string | null
          target_countries: string[] | null
          target_partner_ids: string[] | null
          traffic_split: number | null
          treatment_default_rate: number | null
          treatment_model_version_id: string | null
          treatment_outcomes: number | null
          treatment_requests: number | null
          updated_at: string | null
          winner: string | null
        }
        Insert: {
          control_default_rate?: number | null
          control_model_version_id?: string | null
          control_outcomes?: number | null
          control_requests?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          min_sample_size?: number | null
          name: string
          started_at?: string | null
          statistical_significance?: number | null
          status?: string | null
          target_countries?: string[] | null
          target_partner_ids?: string[] | null
          traffic_split?: number | null
          treatment_default_rate?: number | null
          treatment_model_version_id?: string | null
          treatment_outcomes?: number | null
          treatment_requests?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Update: {
          control_default_rate?: number | null
          control_model_version_id?: string | null
          control_outcomes?: number | null
          control_requests?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          min_sample_size?: number | null
          name?: string
          started_at?: string | null
          statistical_significance?: number | null
          status?: string | null
          target_countries?: string[] | null
          target_partner_ids?: string[] | null
          traffic_split?: number | null
          treatment_default_rate?: number | null
          treatment_model_version_id?: string | null
          treatment_outcomes?: number | null
          treatment_requests?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_experiments_control_model_version_id_fkey"
            columns: ["control_model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_experiments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_experiments_treatment_model_version_id_fkey"
            columns: ["treatment_model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      access_passwords: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          last_used_at: string | null
          password_hash: string
          used_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          password_hash: string
          used_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          password_hash?: string
          used_count?: number | null
        }
        Relationships: []
      }
      aml_investigations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          comparison_notes: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string | null
          decision_reason: string | null
          document_image_url: string | null
          id: string
          kyc_request_id: string | null
          priority: string | null
          sanction_reference_url: string | null
          screening_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          comparison_notes?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_reason?: string | null
          document_image_url?: string | null
          id?: string
          kyc_request_id?: string | null
          priority?: string | null
          sanction_reference_url?: string | null
          screening_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          comparison_notes?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_reason?: string | null
          document_image_url?: string | null
          id?: string
          kyc_request_id?: string | null
          priority?: string | null
          sanction_reference_url?: string | null
          screening_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aml_investigations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aml_investigations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aml_investigations_kyc_request_id_fkey"
            columns: ["kyc_request_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aml_investigations_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "aml_screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_screenings: {
        Row: {
          created_at: string
          dob_hash: string | null
          full_name_hash: string
          id: string
          kyc_request_id: string | null
          match_score: number | null
          match_type: string[] | null
          matches: Json | null
          national_id_hash: string | null
          partner_id: string | null
          pep_category: string | null
          pep_detected: boolean | null
          pep_risk_increase: number | null
          processing_time_ms: number | null
          screening_provider: string | null
          screening_status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dob_hash?: string | null
          full_name_hash: string
          id?: string
          kyc_request_id?: string | null
          match_score?: number | null
          match_type?: string[] | null
          matches?: Json | null
          national_id_hash?: string | null
          partner_id?: string | null
          pep_category?: string | null
          pep_detected?: boolean | null
          pep_risk_increase?: number | null
          processing_time_ms?: number | null
          screening_provider?: string | null
          screening_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dob_hash?: string | null
          full_name_hash?: string
          id?: string
          kyc_request_id?: string | null
          match_score?: number | null
          match_type?: string[] | null
          matches?: Json | null
          national_id_hash?: string | null
          partner_id?: string | null
          pep_category?: string | null
          pep_detected?: boolean | null
          pep_risk_increase?: number | null
          processing_time_ms?: number | null
          screening_provider?: string | null
          screening_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_screenings_kyc_request_id_fkey"
            columns: ["kyc_request_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aml_screenings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      api_velocity_tracking: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          identifier_type: string
          is_suspicious: boolean | null
          payload_hashes: string[] | null
          request_count: number | null
          unique_payloads: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          identifier_type: string
          is_suspicious?: boolean | null
          payload_hashes?: string[] | null
          request_count?: number | null
          unique_payloads?: number | null
          window_end: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          identifier_type?: string
          is_suspicious?: boolean | null
          payload_hashes?: string[] | null
          request_count?: number | null
          unique_payloads?: number | null
          window_end?: string
          window_start?: string
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
      behavior_anomalies: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          anomaly_type: string
          baseline_value: number | null
          created_at: string | null
          description: string | null
          detection_context: string | null
          detection_method: string | null
          deviation_percentage: number | null
          false_positive_probability: number | null
          id: string
          observed_value: number | null
          resolution: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          anomaly_type: string
          baseline_value?: number | null
          created_at?: string | null
          description?: string | null
          detection_context?: string | null
          detection_method?: string | null
          deviation_percentage?: number | null
          false_positive_probability?: number | null
          id?: string
          observed_value?: number | null
          resolution?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          anomaly_type?: string
          baseline_value?: number | null
          created_at?: string | null
          description?: string | null
          detection_context?: string | null
          detection_method?: string | null
          deviation_percentage?: number | null
          false_positive_probability?: number | null
          id?: string
          observed_value?: number | null
          resolution?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blacklisted_ips: {
        Row: {
          banned_at: string
          banned_by: string | null
          banned_until: string | null
          created_at: string
          id: string
          ip_address: string
          is_active: boolean
          reason: string
          trigger_details: Json | null
          trigger_endpoint: string | null
          unban_reason: string | null
          unbanned_at: string | null
          unbanned_by: string | null
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          is_active?: boolean
          reason: string
          trigger_details?: Json | null
          trigger_endpoint?: string | null
          unban_reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          is_active?: boolean
          reason?: string
          trigger_details?: Json | null
          trigger_endpoint?: string | null
          unban_reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
        }
        Relationships: []
      }
      blocked_requests: {
        Row: {
          api_key_prefix: string | null
          block_reason: string
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          feature_name: string
          id: string
          ip_address: string | null
          method: string | null
          request_metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_prefix?: string | null
          block_reason: string
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          feature_name: string
          id?: string
          ip_address?: string | null
          method?: string | null
          request_metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_prefix?: string | null
          block_reason?: string
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          feature_name?: string
          id?: string
          ip_address?: string | null
          method?: string | null
          request_metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      borrower_credits: {
        Row: {
          created_at: string | null
          credit_type: string
          credits_available: number
          credits_used: number
          expires_at: string | null
          id: string
          payment_transaction_id: string | null
          source: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_type: string
          credits_available?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          payment_transaction_id?: string | null
          source: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_type?: string
          credits_available?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          payment_transaction_id?: string | null
          source?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrower_credits_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      borrower_shared_results: {
        Row: {
          accessed_at: string | null
          borrower_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_accessed: boolean | null
          result_id: string
          result_type: string
          share_token: string
          shared_with_email: string | null
          shared_with_partner_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          borrower_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_accessed?: boolean | null
          result_id: string
          result_type: string
          share_token?: string
          shared_with_email?: string | null
          shared_with_partner_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          borrower_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_accessed?: boolean | null
          result_id?: string
          result_type?: string
          share_token?: string
          shared_with_email?: string | null
          shared_with_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_shared_results_shared_with_partner_id_fkey"
            columns: ["shared_with_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_shares: {
        Row: {
          accessed_at: string | null
          amount_paid: number | null
          certificate_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_paid: boolean | null
          share_token: string
          shared_with_email: string | null
          shared_with_partner_id: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          amount_paid?: number | null
          certificate_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_paid?: boolean | null
          share_token?: string
          shared_with_email?: string | null
          shared_with_partner_id?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          amount_paid?: number | null
          certificate_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_paid?: boolean | null
          share_token?: string
          shared_with_email?: string | null
          shared_with_partner_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_shares_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_shares_shared_with_partner_id_fkey"
            columns: ["shared_with_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_subscriptions: {
        Row: {
          amount_paid: number
          created_at: string
          current_certificate_id: string | null
          id: string
          max_free_shares: number | null
          payment_transaction_id: string | null
          plan_id: string
          recertifications_total: number | null
          recertifications_used: number | null
          shares_used: number | null
          smile_id_level: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string
          validity_days: number
        }
        Insert: {
          amount_paid: number
          created_at?: string
          current_certificate_id?: string | null
          id?: string
          max_free_shares?: number | null
          payment_transaction_id?: string | null
          plan_id: string
          recertifications_total?: number | null
          recertifications_used?: number | null
          shares_used?: number | null
          smile_id_level?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until: string
          validity_days: number
        }
        Update: {
          amount_paid?: number
          created_at?: string
          current_certificate_id?: string | null
          id?: string
          max_free_shares?: number | null
          payment_transaction_id?: string | null
          plan_id?: string
          recertifications_total?: number | null
          recertifications_used?: number | null
          shares_used?: number | null
          smile_id_level?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "certificate_subscriptions_current_certificate_id_fkey"
            columns: ["current_certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certainty_coefficient: number | null
          created_at: string
          id: string
          plan_id: string
          proofs_snapshot: Json | null
          recertification_number: number | null
          recertification_of: string | null
          score: number | null
          share_code: string | null
          smile_id_level: string | null
          smile_id_verification_id: string | null
          trust_level: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string
          validated_by_partner_id: string | null
          validation_date: string | null
          validation_status: string | null
        }
        Insert: {
          certainty_coefficient?: number | null
          created_at?: string
          id?: string
          plan_id: string
          proofs_snapshot?: Json | null
          recertification_number?: number | null
          recertification_of?: string | null
          score?: number | null
          share_code?: string | null
          smile_id_level?: string | null
          smile_id_verification_id?: string | null
          trust_level?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until: string
          validated_by_partner_id?: string | null
          validation_date?: string | null
          validation_status?: string | null
        }
        Update: {
          certainty_coefficient?: number | null
          created_at?: string
          id?: string
          plan_id?: string
          proofs_snapshot?: Json | null
          recertification_number?: number | null
          recertification_of?: string | null
          score?: number | null
          share_code?: string | null
          smile_id_level?: string | null
          smile_id_verification_id?: string | null
          trust_level?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string
          validated_by_partner_id?: string | null
          validation_date?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_recertification_of_fkey"
            columns: ["recertification_of"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_validated_by_partner_id_fkey"
            columns: ["validated_by_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          log_type: string
          match_count: number | null
          partner_id: string | null
          performed_by: string | null
          processing_reference: string | null
          result_code: string
          risk_level: string | null
          subject_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          log_type: string
          match_count?: number | null
          partner_id?: string | null
          performed_by?: string | null
          processing_reference?: string | null
          result_code: string
          risk_level?: string | null
          subject_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          log_type?: string
          match_count?: number | null
          partner_id?: string | null
          performed_by?: string | null
          processing_reference?: string | null
          result_code?: string
          risk_level?: string | null
          subject_hash?: string
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          consent_given: boolean
          consent_text: string | null
          consent_type: string
          consent_version: string | null
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          location_data: Json | null
          revocation_reason: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_given: boolean
          consent_text?: string | null
          consent_type: string
          consent_version?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          revocation_reason?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_given?: boolean
          consent_text?: string | null
          consent_type?: string
          consent_version?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          revocation_reason?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
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
      data_source_certainty: {
        Row: {
          base_certainty: number
          certification_requirements: Json | null
          certified_certainty: number
          created_at: string | null
          examples: Json | null
          id: string
          is_active: boolean | null
          source_name: string
          source_type: string
        }
        Insert: {
          base_certainty: number
          certification_requirements?: Json | null
          certified_certainty: number
          created_at?: string | null
          examples?: Json | null
          id?: string
          is_active?: boolean | null
          source_name: string
          source_type: string
        }
        Update: {
          base_certainty?: number
          certification_requirements?: Json | null
          certified_certainty?: number
          created_at?: string | null
          examples?: Json | null
          id?: string
          is_active?: boolean | null
          source_name?: string
          source_type?: string
        }
        Relationships: []
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
      device_fraud_analysis: {
        Row: {
          accounts_on_device: number | null
          analysis_type: string
          created_at: string | null
          device_id: string | null
          device_reputation_score: number | null
          fraud_score: number | null
          id: string
          is_emulator: boolean | null
          is_rooted: boolean | null
          location_spoofing: boolean | null
          multiple_accounts_detected: boolean | null
          proxy_detected: boolean | null
          risk_indicators: Json | null
          timezone_mismatch: boolean | null
          user_id: string | null
          vpn_detected: boolean | null
        }
        Insert: {
          accounts_on_device?: number | null
          analysis_type: string
          created_at?: string | null
          device_id?: string | null
          device_reputation_score?: number | null
          fraud_score?: number | null
          id?: string
          is_emulator?: boolean | null
          is_rooted?: boolean | null
          location_spoofing?: boolean | null
          multiple_accounts_detected?: boolean | null
          proxy_detected?: boolean | null
          risk_indicators?: Json | null
          timezone_mismatch?: boolean | null
          user_id?: string | null
          vpn_detected?: boolean | null
        }
        Update: {
          accounts_on_device?: number | null
          analysis_type?: string
          created_at?: string | null
          device_id?: string | null
          device_reputation_score?: number | null
          fraud_score?: number | null
          id?: string
          is_emulator?: boolean | null
          is_rooted?: boolean | null
          location_spoofing?: boolean | null
          multiple_accounts_detected?: boolean | null
          proxy_detected?: boolean | null
          risk_indicators?: Json | null
          timezone_mismatch?: boolean | null
          user_id?: string | null
          vpn_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "device_fraud_analysis_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      document_fraud_analysis: {
        Row: {
          check_name: string | null
          check_type: string
          confidence: number | null
          created_at: string | null
          details: string | null
          document_id: string | null
          forgery_indicators: Json | null
          fraud_probability: number | null
          id: string
          manipulation_detected: boolean | null
          metadata_validation: Json | null
          passed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          template_match_score: number | null
          user_id: string | null
        }
        Insert: {
          check_name?: string | null
          check_type: string
          confidence?: number | null
          created_at?: string | null
          details?: string | null
          document_id?: string | null
          forgery_indicators?: Json | null
          fraud_probability?: number | null
          id?: string
          manipulation_detected?: boolean | null
          metadata_validation?: Json | null
          passed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          template_match_score?: number | null
          user_id?: string | null
        }
        Update: {
          check_name?: string | null
          check_type?: string
          confidence?: number | null
          created_at?: string | null
          details?: string | null
          document_id?: string | null
          forgery_indicators?: Json | null
          fraud_probability?: number | null
          id?: string
          manipulation_detected?: boolean | null
          metadata_validation?: Json | null
          passed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          template_match_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_fraud_analysis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kyc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_submission_tokens: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          customer_profile_id: string | null
          expires_at: string
          id: string
          kyc_request_id: string | null
          partner_id: string
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          customer_profile_id?: string | null
          expires_at?: string
          id?: string
          kyc_request_id?: string | null
          partner_id: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          customer_profile_id?: string | null
          expires_at?: string
          id?: string
          kyc_request_id?: string | null
          partner_id?: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_submission_tokens_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_submission_tokens_kyc_request_id_fkey"
            columns: ["kyc_request_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_submission_tokens_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_email_hash: string
          resend_id: string | null
          status: string
          template: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email_hash: string
          resend_id?: string | null
          status?: string
          template: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email_hash?: string
          resend_id?: string | null
          status?: string
          template?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      emergency_actions_log: {
        Row: {
          action_type: string
          auto_triggered: boolean | null
          created_at: string | null
          details: Json | null
          feature_name: string | null
          id: string
          integrity_check_result: Json | null
          performed_by: string | null
          trigger_reason: string | null
        }
        Insert: {
          action_type: string
          auto_triggered?: boolean | null
          created_at?: string | null
          details?: Json | null
          feature_name?: string | null
          id?: string
          integrity_check_result?: Json | null
          performed_by?: string | null
          trigger_reason?: string | null
        }
        Update: {
          action_type?: string
          auto_triggered?: boolean | null
          created_at?: string | null
          details?: Json | null
          feature_name?: string | null
          id?: string
          integrity_check_result?: Json | null
          performed_by?: string | null
          trigger_reason?: string | null
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          email_hash: string | null
          failure_reason: string | null
          first_attempt_at: string
          id: string
          ip_address: string
          is_blocked: boolean | null
          last_attempt_at: string
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          email_hash?: string | null
          failure_reason?: string | null
          first_attempt_at?: string
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          last_attempt_at?: string
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          email_hash?: string | null
          failure_reason?: string | null
          first_attempt_at?: string
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          last_attempt_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      feature_performance: {
        Row: {
          adjustment_confidence: number | null
          adjustment_reason: string | null
          baseline_mean: number | null
          baseline_stddev: number | null
          calculated_at: string | null
          correlation_with_default: number | null
          created_at: string | null
          current_mean: number | null
          current_stddev: number | null
          current_weight: number
          data_availability: number | null
          drift_score: number | null
          drift_severity: string | null
          feature_id: string
          feature_name: string | null
          id: string
          information_value: number | null
          model_version_id: string | null
          predictive_power: number | null
          suggested_weight: number | null
        }
        Insert: {
          adjustment_confidence?: number | null
          adjustment_reason?: string | null
          baseline_mean?: number | null
          baseline_stddev?: number | null
          calculated_at?: string | null
          correlation_with_default?: number | null
          created_at?: string | null
          current_mean?: number | null
          current_stddev?: number | null
          current_weight: number
          data_availability?: number | null
          drift_score?: number | null
          drift_severity?: string | null
          feature_id: string
          feature_name?: string | null
          id?: string
          information_value?: number | null
          model_version_id?: string | null
          predictive_power?: number | null
          suggested_weight?: number | null
        }
        Update: {
          adjustment_confidence?: number | null
          adjustment_reason?: string | null
          baseline_mean?: number | null
          baseline_stddev?: number | null
          calculated_at?: string | null
          correlation_with_default?: number | null
          created_at?: string | null
          current_mean?: number | null
          current_stddev?: number | null
          current_weight?: number
          data_availability?: number | null
          drift_score?: number | null
          drift_severity?: string | null
          feature_id?: string
          feature_name?: string | null
          id?: string
          information_value?: number | null
          model_version_id?: string | null
          predictive_power?: number | null
          suggested_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_performance_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
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
      identity_fraud_risk: {
        Row: {
          created_at: string | null
          cross_reference_hits: number | null
          duplicate_identity_suspected: boolean | null
          id: string
          identity_id: string | null
          indicators: Json | null
          investigated_at: string | null
          investigated_by: string | null
          investigation_status: string | null
          notes: string | null
          overall_risk_score: number | null
          risk_level: string | null
          risk_type: string
          synthetic_identity_probability: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cross_reference_hits?: number | null
          duplicate_identity_suspected?: boolean | null
          id?: string
          identity_id?: string | null
          indicators?: Json | null
          investigated_at?: string | null
          investigated_by?: string | null
          investigation_status?: string | null
          notes?: string | null
          overall_risk_score?: number | null
          risk_level?: string | null
          risk_type: string
          synthetic_identity_probability?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cross_reference_hits?: number | null
          duplicate_identity_suspected?: boolean | null
          id?: string
          identity_id?: string | null
          indicators?: Json | null
          investigated_at?: string | null
          investigated_by?: string | null
          investigation_status?: string | null
          notes?: string | null
          overall_risk_score?: number | null
          risk_level?: string | null
          risk_type?: string
          synthetic_identity_probability?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_fraud_risk_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "user_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_users: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          institution_id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_primary_contact: boolean | null
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary_contact?: boolean | null
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          api_access_enabled: boolean | null
          billing_email: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          id: string
          institution_type: string | null
          is_active: boolean | null
          is_verified: boolean | null
          legal_name: string | null
          logo_url: string | null
          name: string
          registration_number: string | null
          settings: Json | null
          tax_id: string | null
          updated_at: string | null
          verified_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          api_access_enabled?: boolean | null
          billing_email?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          registration_number?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          api_access_enabled?: boolean | null
          billing_email?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          registration_number?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      integrity_check_results: {
        Row: {
          anomalies_found: number | null
          check_type: string
          checked_at: string | null
          checked_by: string | null
          id: string
          passed: boolean | null
          suspicious_entries: Json | null
          time_window_minutes: number | null
          transactions_checked: number | null
        }
        Insert: {
          anomalies_found?: number | null
          check_type: string
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          passed?: boolean | null
          suspicious_entries?: Json | null
          time_window_minutes?: number | null
          transactions_checked?: number | null
        }
        Update: {
          anomalies_found?: number | null
          check_type?: string
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          passed?: boolean | null
          suspicious_entries?: Json | null
          time_window_minutes?: number | null
          transactions_checked?: number | null
        }
        Relationships: []
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
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      known_fraudulent_images: {
        Row: {
          detection_count: number | null
          first_detected_at: string
          id: string
          image_hash: string
          image_type: string
          last_detected_at: string
          notes: string | null
          source: string | null
        }
        Insert: {
          detection_count?: number | null
          first_detected_at?: string
          id?: string
          image_hash: string
          image_type: string
          last_detected_at?: string
          notes?: string | null
          source?: string | null
        }
        Update: {
          detection_count?: number | null
          first_detected_at?: string
          id?: string
          image_hash?: string
          image_type?: string
          last_detected_at?: string
          notes?: string | null
          source?: string | null
        }
        Relationships: []
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
      kyc_requests: {
        Row: {
          api_key_id: string | null
          completed_at: string | null
          created_at: string
          customer_profile_id: string | null
          documents_required: string[] | null
          documents_submitted: number | null
          documents_verified: number | null
          fraud_indicators: Json | null
          fraud_score: number | null
          full_name: string
          id: string
          identity_score: number | null
          kyc_level: string | null
          national_id: string | null
          partner_id: string
          phone_number: string | null
          processing_time_ms: number | null
          rejection_reason: string | null
          risk_flags: string[] | null
          risk_level: string | null
          status: string
          updated_at: string
          verifications_performed: Json | null
        }
        Insert: {
          api_key_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_profile_id?: string | null
          documents_required?: string[] | null
          documents_submitted?: number | null
          documents_verified?: number | null
          fraud_indicators?: Json | null
          fraud_score?: number | null
          full_name: string
          id?: string
          identity_score?: number | null
          kyc_level?: string | null
          national_id?: string | null
          partner_id: string
          phone_number?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          risk_flags?: string[] | null
          risk_level?: string | null
          status?: string
          updated_at?: string
          verifications_performed?: Json | null
        }
        Update: {
          api_key_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_profile_id?: string | null
          documents_required?: string[] | null
          documents_submitted?: number | null
          documents_verified?: number | null
          fraud_indicators?: Json | null
          fraud_score?: number | null
          full_name?: string
          id?: string
          identity_score?: number | null
          kyc_level?: string | null
          national_id?: string | null
          partner_id?: string
          phone_number?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          risk_flags?: string[] | null
          risk_level?: string | null
          status?: string
          updated_at?: string
          verifications_performed?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_requests_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_requests_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      learning_metrics: {
        Row: {
          created_at: string | null
          daily_accuracy: number | null
          daily_auc: number | null
          daily_precision: number | null
          daily_recall: number | null
          feature_availability: Json | null
          feature_drift_alerts: Json | null
          id: string
          metric_date: string
          model_version_id: string | null
          outcomes_default: number | null
          outcomes_late: number | null
          outcomes_on_time: number | null
          retraining_reason: string | null
          retraining_recommended: boolean | null
          total_outcomes: number | null
          total_requests: number | null
        }
        Insert: {
          created_at?: string | null
          daily_accuracy?: number | null
          daily_auc?: number | null
          daily_precision?: number | null
          daily_recall?: number | null
          feature_availability?: Json | null
          feature_drift_alerts?: Json | null
          id?: string
          metric_date: string
          model_version_id?: string | null
          outcomes_default?: number | null
          outcomes_late?: number | null
          outcomes_on_time?: number | null
          retraining_reason?: string | null
          retraining_recommended?: boolean | null
          total_outcomes?: number | null
          total_requests?: number | null
        }
        Update: {
          created_at?: string | null
          daily_accuracy?: number | null
          daily_auc?: number | null
          daily_precision?: number | null
          daily_recall?: number | null
          feature_availability?: Json | null
          feature_drift_alerts?: Json | null
          id?: string
          metric_date?: string
          model_version_id?: string | null
          outcomes_default?: number | null
          outcomes_late?: number | null
          outcomes_on_time?: number | null
          retraining_reason?: string | null
          retraining_recommended?: boolean | null
          total_outcomes?: number | null
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_metrics_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          additional_documents: Json | null
          applicant_email: string
          applicant_name: string
          applicant_phone: string
          created_at: string | null
          eligibility_reason: string | null
          id: string
          identity_document_url: string | null
          is_eligible: boolean | null
          kyc_fraud_score: number | null
          kyc_identity_score: number | null
          kyc_request_id: string | null
          kyc_status: string | null
          national_id: string | null
          partner_notes: string | null
          product_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          score: number | null
          score_details: Json | null
          score_grade: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_documents?: Json | null
          applicant_email: string
          applicant_name: string
          applicant_phone: string
          created_at?: string | null
          eligibility_reason?: string | null
          id?: string
          identity_document_url?: string | null
          is_eligible?: boolean | null
          kyc_fraud_score?: number | null
          kyc_identity_score?: number | null
          kyc_request_id?: string | null
          kyc_status?: string | null
          national_id?: string | null
          partner_notes?: string | null
          product_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          score?: number | null
          score_details?: Json | null
          score_grade?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_documents?: Json | null
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string
          created_at?: string | null
          eligibility_reason?: string | null
          id?: string
          identity_document_url?: string | null
          is_eligible?: boolean | null
          kyc_fraud_score?: number | null
          kyc_identity_score?: number | null
          kyc_request_id?: string | null
          kyc_status?: string | null
          national_id?: string | null
          partner_notes?: string | null
          product_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          score?: number | null
          score_details?: Json | null
          score_grade?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_kyc_request_id_fkey"
            columns: ["kyc_request_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_outcomes: {
        Row: {
          created_at: string | null
          customer_profile_id: string | null
          days_late_avg: number | null
          decision_date: string | null
          disbursement_date: string | null
          early_repayment: boolean | null
          grade_at_decision: string | null
          id: string
          interest_rate: number | null
          loan_amount: number | null
          loan_granted: boolean
          loan_tenor_months: number | null
          maturity_date: string | null
          outcome_date: string | null
          outcome_reported_by: string | null
          partial_recovery_amount: number | null
          partner_id: string
          repayment_status: string | null
          risk_level_at_decision: string | null
          score_at_decision: number | null
          scoring_request_id: string | null
          total_repaid: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_profile_id?: string | null
          days_late_avg?: number | null
          decision_date?: string | null
          disbursement_date?: string | null
          early_repayment?: boolean | null
          grade_at_decision?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_granted: boolean
          loan_tenor_months?: number | null
          maturity_date?: string | null
          outcome_date?: string | null
          outcome_reported_by?: string | null
          partial_recovery_amount?: number | null
          partner_id: string
          repayment_status?: string | null
          risk_level_at_decision?: string | null
          score_at_decision?: number | null
          scoring_request_id?: string | null
          total_repaid?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_profile_id?: string | null
          days_late_avg?: number | null
          decision_date?: string | null
          disbursement_date?: string | null
          early_repayment?: boolean | null
          grade_at_decision?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_granted?: boolean
          loan_tenor_months?: number | null
          maturity_date?: string | null
          outcome_date?: string | null
          outcome_reported_by?: string | null
          partial_recovery_amount?: number | null
          partner_id?: string
          repayment_status?: string | null
          risk_level_at_decision?: string | null
          score_at_decision?: number | null
          scoring_request_id?: string | null
          total_repaid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_outcomes_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_outcomes_outcome_reported_by_fkey"
            columns: ["outcome_reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_outcomes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_outcomes_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          id: string
          ip_address: string | null
          level: string
          message: string | null
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string | null
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          applications_count: number | null
          category: string
          countries: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          duration_max_months: number | null
          duration_min_months: number | null
          features: string[] | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          is_featured: boolean | null
          max_amount: number | null
          min_amount: number | null
          min_score_required: number | null
          name: string
          provider_id: string | null
          provider_name: string
          published_at: string | null
          requirements: string[] | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          category: string
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_max_months?: number | null
          duration_min_months?: number | null
          features?: string[] | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          min_score_required?: number | null
          name: string
          provider_id?: string | null
          provider_name: string
          published_at?: string | null
          requirements?: string[] | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          category?: string
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_max_months?: number | null
          duration_min_months?: number | null
          features?: string[] | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          min_score_required?: number | null
          name?: string
          provider_id?: string | null
          provider_name?: string
          published_at?: string | null
          requirements?: string[] | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_versions: {
        Row: {
          accuracy: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          f1_score: number | null
          feature_weights: Json
          fraud_rules: Json
          id: string
          improvement_vs_previous: number | null
          is_active: boolean | null
          ks_statistic: number | null
          name: string | null
          precision_score: number | null
          previous_version_id: string | null
          promoted_by: string | null
          promoted_to_production_at: string | null
          recall_score: number | null
          status: string | null
          sub_score_weights: Json
          thresholds: Json | null
          training_sample_size: number | null
          updated_at: string | null
          validation_auc: number | null
          validation_gini: number | null
          validation_sample_size: number | null
          version: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          f1_score?: number | null
          feature_weights?: Json
          fraud_rules?: Json
          id?: string
          improvement_vs_previous?: number | null
          is_active?: boolean | null
          ks_statistic?: number | null
          name?: string | null
          precision_score?: number | null
          previous_version_id?: string | null
          promoted_by?: string | null
          promoted_to_production_at?: string | null
          recall_score?: number | null
          status?: string | null
          sub_score_weights?: Json
          thresholds?: Json | null
          training_sample_size?: number | null
          updated_at?: string | null
          validation_auc?: number | null
          validation_gini?: number | null
          validation_sample_size?: number | null
          version: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          f1_score?: number | null
          feature_weights?: Json
          fraud_rules?: Json
          id?: string
          improvement_vs_previous?: number | null
          is_active?: boolean | null
          ks_statistic?: number | null
          name?: string | null
          precision_score?: number | null
          previous_version_id?: string | null
          promoted_by?: string | null
          promoted_to_production_at?: string | null
          recall_score?: number | null
          status?: string | null
          sub_score_weights?: Json
          thresholds?: Json | null
          training_sample_size?: number | null
          updated_at?: string | null
          validation_auc?: number | null
          validation_gini?: number | null
          validation_sample_size?: number | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_versions_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_versions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          partner_id: string | null
          phone_number: string
          purpose: string
          user_id: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          partner_id?: string | null
          phone_number: string
          purpose?: string
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          partner_id?: string | null
          phone_number?: string
          purpose?: string
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
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
      pep_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          risk_weight: number
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          risk_weight?: number
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          risk_weight?: number
        }
        Relationships: []
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
      phone_trust_scores: {
        Row: {
          activity_level: string | null
          certification_date: string | null
          created_at: string | null
          fraud_flags: Json | null
          id: string
          identity_cross_validated: boolean | null
          identity_match_score: number | null
          identity_validated_at: string | null
          last_activity_date: string | null
          multiple_users_detected: boolean | null
          otp_verified: boolean | null
          otp_verified_at: string | null
          phone_age_months: number | null
          phone_number: string
          sms_analyzed_at: string | null
          sms_consent_given: boolean | null
          sms_oldest_transaction: string | null
          sms_transactions_count: number | null
          trust_level: string | null
          trust_score: number | null
          updated_at: string | null
          user_id: string | null
          ussd_name_extracted: string | null
          ussd_screenshot_uploaded: boolean | null
          ussd_verification_confidence: number | null
          ussd_verified_at: string | null
        }
        Insert: {
          activity_level?: string | null
          certification_date?: string | null
          created_at?: string | null
          fraud_flags?: Json | null
          id?: string
          identity_cross_validated?: boolean | null
          identity_match_score?: number | null
          identity_validated_at?: string | null
          last_activity_date?: string | null
          multiple_users_detected?: boolean | null
          otp_verified?: boolean | null
          otp_verified_at?: string | null
          phone_age_months?: number | null
          phone_number: string
          sms_analyzed_at?: string | null
          sms_consent_given?: boolean | null
          sms_oldest_transaction?: string | null
          sms_transactions_count?: number | null
          trust_level?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          ussd_name_extracted?: string | null
          ussd_screenshot_uploaded?: boolean | null
          ussd_verification_confidence?: number | null
          ussd_verified_at?: string | null
        }
        Update: {
          activity_level?: string | null
          certification_date?: string | null
          created_at?: string | null
          fraud_flags?: Json | null
          id?: string
          identity_cross_validated?: boolean | null
          identity_match_score?: number | null
          identity_validated_at?: string | null
          last_activity_date?: string | null
          multiple_users_detected?: boolean | null
          otp_verified?: boolean | null
          otp_verified_at?: string | null
          phone_age_months?: number | null
          phone_number?: string
          sms_analyzed_at?: string | null
          sms_consent_given?: boolean | null
          sms_oldest_transaction?: string | null
          sms_transactions_count?: number | null
          trust_level?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          ussd_name_extracted?: string | null
          ussd_screenshot_uploaded?: boolean | null
          ussd_verification_confidence?: number | null
          ussd_verified_at?: string | null
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          metadata: Json | null
          partner_id: string | null
          phone_number: string
          provider: string | null
          purpose: string | null
          user_id: string | null
          verification_method: string
          verification_token: string
          verified_at: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          phone_number: string
          provider?: string | null
          purpose?: string | null
          user_id?: string | null
          verification_method?: string
          verification_token: string
          verified_at: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
          phone_number?: string
          provider?: string | null
          purpose?: string | null
          user_id?: string | null
          verification_method?: string
          verification_token?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      premium_verifications: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          customer_profile_id: string | null
          error_message: string | null
          id: string
          identity_data: Json | null
          paid_at: string | null
          partner_id: string | null
          payment_status: string | null
          payment_transaction_id: string | null
          smile_job_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_result: Json | null
          verification_status: string | null
          verification_type: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_profile_id?: string | null
          error_message?: string | null
          id?: string
          identity_data?: Json | null
          paid_at?: string | null
          partner_id?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          smile_job_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_result?: Json | null
          verification_status?: string | null
          verification_type: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_profile_id?: string | null
          error_message?: string | null
          id?: string
          identity_data?: Json | null
          paid_at?: string | null
          partner_id?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          smile_job_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_result?: Json | null
          verification_status?: string | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_verifications_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_verifications_partner_id_fkey"
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
      sanctions_list_entries: {
        Row: {
          aliases: string[] | null
          created_at: string
          date_of_birth: string | null
          delisted_on: string | null
          entry_type: string
          full_name: string
          full_name_normalized: string
          id: string
          is_active: boolean | null
          last_updated: string
          list_source: string
          list_version: string | null
          listed_on: string | null
          national_id: string | null
          nationality: string[] | null
          raw_data: Json | null
          reason: string | null
          reference_url: string | null
          sanction_type: string[] | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          delisted_on?: string | null
          entry_type: string
          full_name: string
          full_name_normalized: string
          id?: string
          is_active?: boolean | null
          last_updated?: string
          list_source: string
          list_version?: string | null
          listed_on?: string | null
          national_id?: string | null
          nationality?: string[] | null
          raw_data?: Json | null
          reason?: string | null
          reference_url?: string | null
          sanction_type?: string[] | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          delisted_on?: string | null
          entry_type?: string
          full_name?: string
          full_name_normalized?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string
          list_source?: string
          list_version?: string | null
          listed_on?: string | null
          national_id?: string | null
          nationality?: string[] | null
          raw_data?: Json | null
          reason?: string | null
          reference_url?: string | null
          sanction_type?: string[] | null
        }
        Relationships: []
      }
      score_engineered_features: {
        Row: {
          calculated_at: string | null
          contribution_to_score: number | null
          feature_id: string
          id: string
          normalized_value: number | null
          raw_feature_ids: string[] | null
          scoring_request_id: string | null
          sub_score_category: string | null
          transformation: string | null
          weight_applied: number | null
        }
        Insert: {
          calculated_at?: string | null
          contribution_to_score?: number | null
          feature_id: string
          id?: string
          normalized_value?: number | null
          raw_feature_ids?: string[] | null
          scoring_request_id?: string | null
          sub_score_category?: string | null
          transformation?: string | null
          weight_applied?: number | null
        }
        Update: {
          calculated_at?: string | null
          contribution_to_score?: number | null
          feature_id?: string
          id?: string
          normalized_value?: number | null
          raw_feature_ids?: string[] | null
          scoring_request_id?: string | null
          sub_score_category?: string | null
          transformation?: string | null
          weight_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "score_engineered_features_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      score_history: {
        Row: {
          created_at: string | null
          data_quality: string | null
          data_sources_count: number | null
          grade: string | null
          id: string
          model_version: string | null
          risk_tier: string | null
          score_value: number | null
          scoring_request_id: string | null
          sub_scores: Json | null
          trigger_event: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_quality?: string | null
          data_sources_count?: number | null
          grade?: string | null
          id?: string
          model_version?: string | null
          risk_tier?: string | null
          score_value?: number | null
          scoring_request_id?: string | null
          sub_scores?: Json | null
          trigger_event?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_quality?: string | null
          data_sources_count?: number | null
          grade?: string | null
          id?: string
          model_version?: string | null
          risk_tier?: string | null
          score_value?: number | null
          scoring_request_id?: string | null
          sub_scores?: Json | null
          trigger_event?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_history_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      score_raw_features: {
        Row: {
          calculated_at: string | null
          category: string | null
          confidence: number | null
          feature_id: string
          feature_name: string | null
          id: string
          imputation_method: string | null
          is_missing: boolean | null
          raw_value: number | null
          scoring_request_id: string | null
          source: string | null
          source_id: string | null
          source_table: string | null
          string_value: string | null
          user_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          category?: string | null
          confidence?: number | null
          feature_id: string
          feature_name?: string | null
          id?: string
          imputation_method?: string | null
          is_missing?: boolean | null
          raw_value?: number | null
          scoring_request_id?: string | null
          source?: string | null
          source_id?: string | null
          source_table?: string | null
          string_value?: string | null
          user_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          category?: string | null
          confidence?: number | null
          feature_id?: string
          feature_name?: string | null
          id?: string
          imputation_method?: string | null
          is_missing?: boolean | null
          raw_value?: number | null
          scoring_request_id?: string | null
          source?: string | null
          source_id?: string | null
          source_table?: string | null
          string_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_raw_features_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_requests: {
        Row: {
          city: string | null
          company_name: string | null
          confidence: number | null
          consent_id: string | null
          created_at: string
          credit_recommendation: Json | null
          customer_profile_id: string | null
          data_quality: string | null
          employment_type: string | null
          engagement_capacity_score: number | null
          error_message: string | null
          existing_loans: number | null
          explanations: Json | null
          feature_importance: Json | null
          fraud_analysis: Json | null
          full_name: string | null
          grade: string | null
          id: string
          improvement_suggestions: Json | null
          mobile_money_transactions: number | null
          mobile_money_volume: number | null
          model_version: string | null
          monthly_expenses: number | null
          monthly_income: number | null
          national_id: string | null
          negative_factors: Json | null
          phone_number: string | null
          positive_factors: Json | null
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
          sub_scores: Json | null
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
          consent_id?: string | null
          created_at?: string
          credit_recommendation?: Json | null
          customer_profile_id?: string | null
          data_quality?: string | null
          employment_type?: string | null
          engagement_capacity_score?: number | null
          error_message?: string | null
          existing_loans?: number | null
          explanations?: Json | null
          feature_importance?: Json | null
          fraud_analysis?: Json | null
          full_name?: string | null
          grade?: string | null
          id?: string
          improvement_suggestions?: Json | null
          mobile_money_transactions?: number | null
          mobile_money_volume?: number | null
          model_version?: string | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          national_id?: string | null
          negative_factors?: Json | null
          phone_number?: string | null
          positive_factors?: Json | null
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
          sub_scores?: Json | null
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
          consent_id?: string | null
          created_at?: string
          credit_recommendation?: Json | null
          customer_profile_id?: string | null
          data_quality?: string | null
          employment_type?: string | null
          engagement_capacity_score?: number | null
          error_message?: string | null
          existing_loans?: number | null
          explanations?: Json | null
          feature_importance?: Json | null
          fraud_analysis?: Json | null
          full_name?: string | null
          grade?: string | null
          id?: string
          improvement_suggestions?: Json | null
          mobile_money_transactions?: number | null
          mobile_money_volume?: number | null
          model_version?: string | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          national_id?: string | null
          negative_factors?: Json | null
          phone_number?: string | null
          positive_factors?: Json | null
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
          sub_scores?: Json | null
          updated_at?: string
          user_id?: string | null
          utility_payments_late?: number | null
          utility_payments_on_time?: number | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_requests_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "data_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_requests_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshot_analyses: {
        Row: {
          created_at: string | null
          detected_provider: string | null
          ela_anomalies: Json | null
          extracted_balance: number | null
          extracted_currency: string | null
          extracted_name: string | null
          extracted_phone: string | null
          extracted_transactions: Json | null
          file_url: string | null
          freshness: string | null
          id: string
          image_hash: string | null
          kyc_request_id: string | null
          metadata_consistency: boolean | null
          newest_transaction_date: string | null
          oldest_transaction_date: string | null
          overall_confidence: number | null
          provider_confidence: number | null
          raw_ocr_text: string | null
          scoring_request_id: string | null
          screenshot_date: string | null
          tampering_probability: number | null
          transaction_count: number | null
          ui_authenticity_score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detected_provider?: string | null
          ela_anomalies?: Json | null
          extracted_balance?: number | null
          extracted_currency?: string | null
          extracted_name?: string | null
          extracted_phone?: string | null
          extracted_transactions?: Json | null
          file_url?: string | null
          freshness?: string | null
          id?: string
          image_hash?: string | null
          kyc_request_id?: string | null
          metadata_consistency?: boolean | null
          newest_transaction_date?: string | null
          oldest_transaction_date?: string | null
          overall_confidence?: number | null
          provider_confidence?: number | null
          raw_ocr_text?: string | null
          scoring_request_id?: string | null
          screenshot_date?: string | null
          tampering_probability?: number | null
          transaction_count?: number | null
          ui_authenticity_score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detected_provider?: string | null
          ela_anomalies?: Json | null
          extracted_balance?: number | null
          extracted_currency?: string | null
          extracted_name?: string | null
          extracted_phone?: string | null
          extracted_transactions?: Json | null
          file_url?: string | null
          freshness?: string | null
          id?: string
          image_hash?: string | null
          kyc_request_id?: string | null
          metadata_consistency?: boolean | null
          newest_transaction_date?: string | null
          oldest_transaction_date?: string | null
          overall_confidence?: number | null
          provider_confidence?: number | null
          raw_ocr_text?: string | null
          scoring_request_id?: string | null
          screenshot_date?: string | null
          tampering_probability?: number | null
          transaction_count?: number | null
          ui_authenticity_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_analyses_kyc_request_id_fkey"
            columns: ["kyc_request_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshot_analyses_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_taken: string | null
          alert_type: string
          api_key_id: string | null
          created_at: string
          endpoint: string | null
          fingerprint: string | null
          id: string
          is_acknowledged: boolean | null
          notes: string | null
          payload: Json | null
          severity: string
          source_ip: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type: string
          api_key_id?: string | null
          created_at?: string
          endpoint?: string | null
          fingerprint?: string | null
          id?: string
          is_acknowledged?: boolean | null
          notes?: string | null
          payload?: Json | null
          severity?: string
          source_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type?: string
          api_key_id?: string | null
          created_at?: string
          endpoint?: string | null
          fingerprint?: string | null
          id?: string
          is_acknowledged?: boolean | null
          notes?: string | null
          payload?: Json | null
          severity?: string
          source_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      sla_configs: {
        Row: {
          created_at: string | null
          description: string | null
          escalation_minutes: number
          first_response_minutes: number
          id: string
          is_active: boolean | null
          name: string
          priority: string
          resolution_minutes: number
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          escalation_minutes?: number
          first_response_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          priority: string
          resolution_minutes?: number
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          escalation_minutes?: number
          first_response_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string
          resolution_minutes?: number
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      sms_analyses: {
        Row: {
          amount: number | null
          balance_after: number | null
          counterparty_name: string | null
          counterparty_phone: string | null
          created_at: string | null
          currency: string | null
          detected_provider: string | null
          id: string
          is_validated: boolean | null
          parse_confidence: number | null
          pattern_matched: string | null
          raw_sms_text: string
          scoring_request_id: string | null
          sender_shortcode: string | null
          sms_date: string | null
          transaction_ref: string | null
          transaction_type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          counterparty_name?: string | null
          counterparty_phone?: string | null
          created_at?: string | null
          currency?: string | null
          detected_provider?: string | null
          id?: string
          is_validated?: boolean | null
          parse_confidence?: number | null
          pattern_matched?: string | null
          raw_sms_text: string
          scoring_request_id?: string | null
          sender_shortcode?: string | null
          sms_date?: string | null
          transaction_ref?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          counterparty_name?: string | null
          counterparty_phone?: string | null
          created_at?: string | null
          currency?: string | null
          detected_provider?: string | null
          id?: string
          is_validated?: boolean | null
          parse_confidence?: number | null
          pattern_matched?: string | null
          raw_sms_text?: string
          scoring_request_id?: string | null
          sender_shortcode?: string | null
          sms_date?: string | null
          transaction_ref?: string | null
          transaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_analyses_scoring_request_id_fkey"
            columns: ["scoring_request_id"]
            isOneToOne: false
            referencedRelation: "scoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          cta: string | null
          currency: string
          description: string | null
          features: Json | null
          highlight: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          limits: Json | null
          max_free_shares: number | null
          name: string
          not_included: Json | null
          period: string | null
          plan_type: string | null
          popular: boolean | null
          price_monthly: number
          price_yearly: number | null
          quotas: Json | null
          recertifications: number | null
          share_price: number | null
          slug: string | null
          smile_id_level: string | null
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          created_at?: string
          cta?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          highlight?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          limits?: Json | null
          max_free_shares?: number | null
          name: string
          not_included?: Json | null
          period?: string | null
          plan_type?: string | null
          popular?: boolean | null
          price_monthly?: number
          price_yearly?: number | null
          quotas?: Json | null
          recertifications?: number | null
          share_price?: number | null
          slug?: string | null
          smile_id_level?: string | null
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          created_at?: string
          cta?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          highlight?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          limits?: Json | null
          max_free_shares?: number | null
          name?: string
          not_included?: Json | null
          period?: string | null
          plan_type?: string | null
          popular?: boolean | null
          price_monthly?: number
          price_yearly?: number | null
          quotas?: Json | null
          recertifications?: number | null
          share_price?: number | null
          slug?: string | null
          smile_id_level?: string | null
          updated_at?: string
          validity_days?: number | null
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
          trial_expired_notified: boolean | null
          trial_reminder_sent_at: string | null
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
          trial_expired_notified?: boolean | null
          trial_reminder_sent_at?: string | null
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
          trial_expired_notified?: boolean | null
          trial_reminder_sent_at?: string | null
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
      suggested_response_usage: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          knowledge_base_id: string | null
          ticket_id: string
          was_helpful: boolean | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          ticket_id: string
          was_helpful?: boolean | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          knowledge_base_id?: string | null
          ticket_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "suggested_response_usage_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_response_usage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_priority_reason: string | null
          ai_sentiment_score: number | null
          ai_suggested_category: string | null
          ai_summary: string | null
          assigned_to: string | null
          attachments: Json | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          csat_sent_at: string | null
          description: string
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          first_response_at: string | null
          frustration_score: number | null
          id: string
          internal_notes: string | null
          last_viewed_at: string | null
          partner_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          related_certificate_id: string | null
          related_kyc_id: string | null
          resolved_at: string | null
          sla_breached: boolean | null
          sla_first_response_at: string | null
          sla_resolution_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          ai_priority_reason?: string | null
          ai_sentiment_score?: number | null
          ai_suggested_category?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          csat_sent_at?: string | null
          description: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          frustration_score?: number | null
          id?: string
          internal_notes?: string | null
          last_viewed_at?: string | null
          partner_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_certificate_id?: string | null
          related_kyc_id?: string | null
          resolved_at?: string | null
          sla_breached?: boolean | null
          sla_first_response_at?: string | null
          sla_resolution_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          ai_priority_reason?: string | null
          ai_sentiment_score?: number | null
          ai_suggested_category?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          csat_sent_at?: string | null
          description?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          frustration_score?: number | null
          id?: string
          internal_notes?: string | null
          last_viewed_at?: string | null
          partner_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_certificate_id?: string | null
          related_kyc_id?: string | null
          resolved_at?: string | null
          sla_breached?: boolean | null
          sla_first_response_at?: string | null
          sla_resolution_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_certificate_id_fkey"
            columns: ["related_certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_kyc_id_fkey"
            columns: ["related_kyc_id"]
            isOneToOne: false
            referencedRelation: "kyc_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_lockdown_state: {
        Row: {
          auto_triggered: boolean | null
          created_at: string | null
          id: string
          is_full_lockdown: boolean | null
          is_read_only_mode: boolean | null
          lockdown_message: string | null
          lockdown_reason: string | null
          locked_at: string | null
          locked_by: string | null
          trigger_source: string | null
          updated_at: string | null
        }
        Insert: {
          auto_triggered?: boolean | null
          created_at?: string | null
          id?: string
          is_full_lockdown?: boolean | null
          is_read_only_mode?: boolean | null
          lockdown_message?: string | null
          lockdown_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_triggered?: boolean | null
          created_at?: string | null
          id?: string
          is_full_lockdown?: boolean | null
          is_read_only_mode?: boolean | null
          lockdown_message?: string | null
          lockdown_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_security_controls: {
        Row: {
          auto_disabled_reason: string | null
          created_at: string | null
          description: string | null
          display_name: string
          emergency_message: string | null
          feature_name: string
          id: string
          is_active: boolean | null
          last_toggled_at: string | null
          restricted_to_roles: string[] | null
          toggled_by: string | null
          updated_at: string | null
        }
        Insert: {
          auto_disabled_reason?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          emergency_message?: string | null
          feature_name: string
          id?: string
          is_active?: boolean | null
          last_toggled_at?: string | null
          restricted_to_roles?: string[] | null
          toggled_by?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_disabled_reason?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          emergency_message?: string | null
          feature_name?: string
          id?: string
          is_active?: boolean | null
          last_toggled_at?: string | null
          restricted_to_roles?: string[] | null
          toggled_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      ticket_csat: {
        Row: {
          agent_id: string | null
          created_at: string | null
          feedback: string | null
          id: string
          rating: number
          resolution_quality: number | null
          response_speed: number | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: number
          resolution_quality?: number | null
          response_speed?: number | null
          ticket_id: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          resolution_quality?: number | null
          response_speed?: number | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_csat_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          ticket_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          ticket_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          ticket_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          author_id: string
          author_role: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_automated: boolean | null
          is_internal: boolean | null
          read_at: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          author_role: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_automated?: boolean | null
          is_internal?: boolean | null
          read_at?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          author_role?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_automated?: boolean | null
          is_internal?: boolean | null
          read_at?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tags: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          source: string | null
          tag: string
          ticket_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          source?: string | null
          tag: string
          ticket_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          source?: string | null
          tag?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tags_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          region: string | null
          residence_since: string | null
          street_address: string | null
          updated_at: string | null
          user_id: string
          verification_method: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          residence_since?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          residence_since?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_bank_statements: {
        Row: {
          account_number_masked: string | null
          account_type: string | null
          average_balance: number | null
          bank_name: string
          closing_balance: number | null
          created_at: string | null
          id: string
          max_balance: number | null
          min_balance: number | null
          ocr_confidence: number | null
          opening_balance: number | null
          period_end: string | null
          period_start: string | null
          regular_payments: Json | null
          salary_amount: number | null
          salary_detected: boolean | null
          salary_regularity_score: number | null
          source_file_url: string | null
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          account_number_masked?: string | null
          account_type?: string | null
          average_balance?: number | null
          bank_name: string
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          max_balance?: number | null
          min_balance?: number | null
          ocr_confidence?: number | null
          opening_balance?: number | null
          period_end?: string | null
          period_start?: string | null
          regular_payments?: Json | null
          salary_amount?: number | null
          salary_detected?: boolean | null
          salary_regularity_score?: number | null
          source_file_url?: string | null
          total_credits?: number | null
          total_debits?: number | null
          transaction_count?: number | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          account_number_masked?: string | null
          account_type?: string | null
          average_balance?: number | null
          bank_name?: string
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          max_balance?: number | null
          min_balance?: number | null
          ocr_confidence?: number | null
          opening_balance?: number | null
          period_end?: string | null
          period_start?: string | null
          regular_payments?: Json | null
          salary_amount?: number | null
          salary_detected?: boolean | null
          salary_regularity_score?: number | null
          source_file_url?: string | null
          total_credits?: number | null
          total_debits?: number | null
          transaction_count?: number | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_behavior_metrics: {
        Row: {
          corrections_made: number | null
          created_at: string | null
          document_upload_speed_score: number | null
          errors_made: number | null
          form_completion_rate: number | null
          help_accessed: number | null
          id: string
          login_count: number | null
          navigation_coherence: number | null
          period_end: string | null
          period_start: string | null
          session_avg_duration_minutes: number | null
          time_to_complete_kyc_hours: number | null
          user_id: string
        }
        Insert: {
          corrections_made?: number | null
          created_at?: string | null
          document_upload_speed_score?: number | null
          errors_made?: number | null
          form_completion_rate?: number | null
          help_accessed?: number | null
          id?: string
          login_count?: number | null
          navigation_coherence?: number | null
          period_end?: string | null
          period_start?: string | null
          session_avg_duration_minutes?: number | null
          time_to_complete_kyc_hours?: number | null
          user_id: string
        }
        Update: {
          corrections_made?: number | null
          created_at?: string | null
          document_upload_speed_score?: number | null
          errors_made?: number | null
          form_completion_rate?: number | null
          help_accessed?: number | null
          id?: string
          login_count?: number | null
          navigation_coherence?: number | null
          period_end?: string | null
          period_start?: string | null
          session_avg_duration_minutes?: number | null
          time_to_complete_kyc_hours?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_community_attestations: {
        Row: {
          attestation_date: string | null
          attestation_type: string | null
          content_summary: string | null
          created_at: string | null
          file_url: string | null
          id: string
          issuer_address: string | null
          issuer_name: string
          issuer_phone: string | null
          issuer_title: string | null
          trust_score: number | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attestation_date?: string | null
          attestation_type?: string | null
          content_summary?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          issuer_address?: string | null
          issuer_name: string
          issuer_phone?: string | null
          issuer_title?: string | null
          trust_score?: number | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attestation_date?: string | null
          attestation_type?: string | null
          content_summary?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          issuer_address?: string | null
          issuer_name?: string
          issuer_phone?: string | null
          issuer_title?: string | null
          trust_score?: number | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_cooperative_memberships: {
        Row: {
          attestation_url: string | null
          contact_person: string | null
          contact_phone: string | null
          cooperative_name: string
          cooperative_type: string | null
          created_at: string | null
          current_loan_amount: number | null
          current_loan_balance: number | null
          id: string
          loans_defaulted: number | null
          loans_repaid_on_time: number | null
          loans_taken: number | null
          member_since: string | null
          registration_number: string | null
          role: string | null
          share_capital: number | null
          standing_score: number | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          attestation_url?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cooperative_name: string
          cooperative_type?: string | null
          created_at?: string | null
          current_loan_amount?: number | null
          current_loan_balance?: number | null
          id?: string
          loans_defaulted?: number | null
          loans_repaid_on_time?: number | null
          loans_taken?: number | null
          member_since?: string | null
          registration_number?: string | null
          role?: string | null
          share_capital?: number | null
          standing_score?: number | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          attestation_url?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cooperative_name?: string
          cooperative_type?: string | null
          created_at?: string | null
          current_loan_amount?: number | null
          current_loan_balance?: number | null
          id?: string
          loans_defaulted?: number | null
          loans_repaid_on_time?: number | null
          loans_taken?: number | null
          member_since?: string | null
          registration_number?: string | null
          role?: string | null
          share_capital?: number | null
          standing_score?: number | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          app_usage_hours: number | null
          battery_health: number | null
          browser: string | null
          created_at: string | null
          device_id: string | null
          device_type: string | null
          first_seen_at: string | null
          id: string
          is_primary: boolean | null
          language: string | null
          last_seen_at: string | null
          location_stability: number | null
          mobility_radius_km: number | null
          os: string | null
          os_version: string | null
          phone_age_months: number | null
          risk_score: number | null
          screen_resolution: string | null
          sim_age_months: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_usage_hours?: number | null
          battery_health?: number | null
          browser?: string | null
          created_at?: string | null
          device_id?: string | null
          device_type?: string | null
          first_seen_at?: string | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          location_stability?: number | null
          mobility_radius_km?: number | null
          os?: string | null
          os_version?: string | null
          phone_age_months?: number | null
          risk_score?: number | null
          screen_resolution?: string | null
          sim_age_months?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_usage_hours?: number | null
          battery_health?: number | null
          browser?: string | null
          created_at?: string | null
          device_id?: string | null
          device_type?: string | null
          first_seen_at?: string | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          location_stability?: number | null
          mobility_radius_km?: number | null
          os?: string | null
          os_version?: string | null
          phone_age_months?: number | null
          risk_score?: number | null
          screen_resolution?: string | null
          sim_age_months?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_economic_context: {
        Row: {
          agricultural_zone: boolean | null
          city: string | null
          created_at: string | null
          id: string
          inflation_rate: number | null
          last_updated_at: string | null
          local_poverty_index: number | null
          local_unemployment_rate: number | null
          main_economic_activity: string | null
          region: string | null
          seasonal_factors: Json | null
          user_id: string
          zone_type: string | null
        }
        Insert: {
          agricultural_zone?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          inflation_rate?: number | null
          last_updated_at?: string | null
          local_poverty_index?: number | null
          local_unemployment_rate?: number | null
          main_economic_activity?: string | null
          region?: string | null
          seasonal_factors?: Json | null
          user_id: string
          zone_type?: string | null
        }
        Update: {
          agricultural_zone?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          inflation_rate?: number | null
          last_updated_at?: string | null
          local_poverty_index?: number | null
          local_unemployment_rate?: number | null
          main_economic_activity?: string | null
          region?: string | null
          seasonal_factors?: Json | null
          user_id?: string
          zone_type?: string | null
        }
        Relationships: []
      }
      user_guarantors: {
        Row: {
          address: string | null
          consent_date: string | null
          consent_given: boolean | null
          created_at: string | null
          email: string | null
          employer: string | null
          estimated_income: number | null
          guarantor_name: string
          id: string
          identity_verified: boolean | null
          national_id: string | null
          notes: string | null
          occupation: string | null
          phone_number: string | null
          phone_verified: boolean | null
          quality_score: number | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          email?: string | null
          employer?: string | null
          estimated_income?: number | null
          guarantor_name: string
          id?: string
          identity_verified?: boolean | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          quality_score?: number | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          email?: string | null
          employer?: string | null
          estimated_income?: number | null
          guarantor_name?: string
          id?: string
          identity_verified?: boolean | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          quality_score?: number | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_identities: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          document_expiry: string | null
          document_number: string | null
          document_type: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          issuing_authority: string | null
          issuing_country: string | null
          last_name: string | null
          mrz_data: string | null
          nationality: string | null
          ocr_confidence: number | null
          place_of_birth: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          document_expiry?: string | null
          document_number?: string | null
          document_type?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          issuing_authority?: string | null
          issuing_country?: string | null
          last_name?: string | null
          mrz_data?: string | null
          nationality?: string | null
          ocr_confidence?: number | null
          place_of_birth?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          document_expiry?: string | null
          document_number?: string | null
          document_type?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          issuing_authority?: string | null
          issuing_country?: string | null
          last_name?: string | null
          mrz_data?: string | null
          nationality?: string | null
          ocr_confidence?: number | null
          place_of_birth?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_informal_income: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string | null
          estimated_monthly_amount: number | null
          evidence_type: string | null
          evidence_urls: Json | null
          frequency: string | null
          id: string
          income_type: string | null
          season_end_month: number | null
          season_start_month: number | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          estimated_monthly_amount?: number | null
          evidence_type?: string | null
          evidence_urls?: Json | null
          frequency?: string | null
          id?: string
          income_type?: string | null
          season_end_month?: number | null
          season_start_month?: number | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          estimated_monthly_amount?: number | null
          evidence_type?: string | null
          evidence_urls?: Json | null
          frequency?: string | null
          id?: string
          income_type?: string | null
          season_end_month?: number | null
          season_start_month?: number | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_momo_transactions: {
        Row: {
          avg_transaction_size: number | null
          bill_payment_count: number | null
          cash_in_ratio: number | null
          created_at: string | null
          id: string
          merchant_payment_count: number | null
          p2p_count: number | null
          period_end: string | null
          period_start: string | null
          phone_number: string | null
          provider: string | null
          regularity_score: number | null
          source_file_url: string | null
          source_type: string | null
          total_in: number | null
          total_out: number | null
          transaction_count: number | null
          unique_contacts: number | null
          user_id: string
          velocity_30d: number | null
          velocity_7d: number | null
        }
        Insert: {
          avg_transaction_size?: number | null
          bill_payment_count?: number | null
          cash_in_ratio?: number | null
          created_at?: string | null
          id?: string
          merchant_payment_count?: number | null
          p2p_count?: number | null
          period_end?: string | null
          period_start?: string | null
          phone_number?: string | null
          provider?: string | null
          regularity_score?: number | null
          source_file_url?: string | null
          source_type?: string | null
          total_in?: number | null
          total_out?: number | null
          transaction_count?: number | null
          unique_contacts?: number | null
          user_id: string
          velocity_30d?: number | null
          velocity_7d?: number | null
        }
        Update: {
          avg_transaction_size?: number | null
          bill_payment_count?: number | null
          cash_in_ratio?: number | null
          created_at?: string | null
          id?: string
          merchant_payment_count?: number | null
          p2p_count?: number | null
          period_end?: string | null
          period_start?: string | null
          phone_number?: string | null
          provider?: string | null
          regularity_score?: number | null
          source_file_url?: string | null
          source_type?: string | null
          total_in?: number | null
          total_out?: number | null
          transaction_count?: number | null
          unique_contacts?: number | null
          user_id?: string
          velocity_30d?: number | null
          velocity_7d?: number | null
        }
        Relationships: []
      }
      user_psychometric_results: {
        Row: {
          attention_score: number | null
          completed_at: string | null
          composite_score: number | null
          created_at: string | null
          duration_seconds: number | null
          financial_literacy: number | null
          hesitation_pattern: string | null
          id: string
          invalidation_reason: string | null
          is_valid: boolean | null
          optimism_bias: number | null
          pattern_detected: string | null
          planning_horizon: number | null
          questions_count: number | null
          quiz_version: string | null
          random_check_passed: boolean | null
          response_consistency: number | null
          risk_tolerance: number | null
          self_control: number | null
          started_at: string | null
          time_anomalies: number | null
          user_id: string
        }
        Insert: {
          attention_score?: number | null
          completed_at?: string | null
          composite_score?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          financial_literacy?: number | null
          hesitation_pattern?: string | null
          id?: string
          invalidation_reason?: string | null
          is_valid?: boolean | null
          optimism_bias?: number | null
          pattern_detected?: string | null
          planning_horizon?: number | null
          questions_count?: number | null
          quiz_version?: string | null
          random_check_passed?: boolean | null
          response_consistency?: number | null
          risk_tolerance?: number | null
          self_control?: number | null
          started_at?: string | null
          time_anomalies?: number | null
          user_id: string
        }
        Update: {
          attention_score?: number | null
          completed_at?: string | null
          composite_score?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          financial_literacy?: number | null
          hesitation_pattern?: string | null
          id?: string
          invalidation_reason?: string | null
          is_valid?: boolean | null
          optimism_bias?: number | null
          pattern_detected?: string | null
          planning_horizon?: number | null
          questions_count?: number | null
          quiz_version?: string | null
          random_check_passed?: boolean | null
          response_consistency?: number | null
          risk_tolerance?: number | null
          self_control?: number | null
          started_at?: string | null
          time_anomalies?: number | null
          user_id?: string
        }
        Relationships: []
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
      user_selfie_liveness: {
        Row: {
          checks_failed: Json | null
          checks_passed: Json | null
          created_at: string | null
          device_id: string | null
          face_match_score: number | null
          id: string
          is_face_match: boolean | null
          is_live: boolean | null
          liveness_method: string | null
          liveness_score: number | null
          liveness_video_url: string | null
          selfie_url: string | null
          user_id: string
        }
        Insert: {
          checks_failed?: Json | null
          checks_passed?: Json | null
          created_at?: string | null
          device_id?: string | null
          face_match_score?: number | null
          id?: string
          is_face_match?: boolean | null
          is_live?: boolean | null
          liveness_method?: string | null
          liveness_score?: number | null
          liveness_video_url?: string | null
          selfie_url?: string | null
          user_id: string
        }
        Update: {
          checks_failed?: Json | null
          checks_passed?: Json | null
          created_at?: string | null
          device_id?: string | null
          face_match_score?: number | null
          id?: string
          is_face_match?: boolean | null
          is_live?: boolean | null
          liveness_method?: string | null
          liveness_score?: number | null
          liveness_video_url?: string | null
          selfie_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_selfie_liveness_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
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
      user_social_links: {
        Row: {
          account_age_months: number | null
          active_contacts_30d: number | null
          contact_count: number | null
          created_at: string | null
          id: string
          last_analyzed_at: string | null
          link_type: string | null
          network_quality_score: number | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          account_age_months?: number | null
          active_contacts_30d?: number | null
          contact_count?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          link_type?: string | null
          network_quality_score?: number | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          account_age_months?: number | null
          active_contacts_30d?: number | null
          contact_count?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          link_type?: string | null
          network_quality_score?: number | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_tontine_memberships: {
        Row: {
          attestation_provided: boolean | null
          attestation_url: string | null
          contribution_amount: number | null
          created_at: string | null
          discipline_score: number | null
          frequency: string | null
          group_name: string
          group_size: number | null
          has_received: boolean | null
          id: string
          is_organizer: boolean | null
          is_treasurer: boolean | null
          member_since: string | null
          organizer_phone: string | null
          payments_late: number | null
          payments_made: number | null
          payments_missed: number | null
          position_in_cycle: number | null
          received_amount: number | null
          received_date: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          attestation_provided?: boolean | null
          attestation_url?: string | null
          contribution_amount?: number | null
          created_at?: string | null
          discipline_score?: number | null
          frequency?: string | null
          group_name: string
          group_size?: number | null
          has_received?: boolean | null
          id?: string
          is_organizer?: boolean | null
          is_treasurer?: boolean | null
          member_since?: string | null
          organizer_phone?: string | null
          payments_late?: number | null
          payments_made?: number | null
          payments_missed?: number | null
          position_in_cycle?: number | null
          received_amount?: number | null
          received_date?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          attestation_provided?: boolean | null
          attestation_url?: string | null
          contribution_amount?: number | null
          created_at?: string | null
          discipline_score?: number | null
          frequency?: string | null
          group_name?: string
          group_size?: number | null
          has_received?: boolean | null
          id?: string
          is_organizer?: boolean | null
          is_treasurer?: boolean | null
          member_since?: string | null
          organizer_phone?: string | null
          payments_late?: number | null
          payments_made?: number | null
          payments_missed?: number | null
          position_in_cycle?: number | null
          received_amount?: number | null
          received_date?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_utility_bills: {
        Row: {
          account_number: string | null
          address_id: string | null
          amount: number | null
          bill_date: string | null
          created_at: string | null
          days_late: number | null
          due_date: string | null
          id: string
          ocr_confidence: number | null
          paid: boolean | null
          paid_date: string | null
          provider: string | null
          source_file_url: string | null
          user_id: string
          utility_type: string | null
        }
        Insert: {
          account_number?: string | null
          address_id?: string | null
          amount?: number | null
          bill_date?: string | null
          created_at?: string | null
          days_late?: number | null
          due_date?: string | null
          id?: string
          ocr_confidence?: number | null
          paid?: boolean | null
          paid_date?: string | null
          provider?: string | null
          source_file_url?: string | null
          user_id: string
          utility_type?: string | null
        }
        Update: {
          account_number?: string | null
          address_id?: string | null
          amount?: number | null
          bill_date?: string | null
          created_at?: string | null
          days_late?: number | null
          due_date?: string | null
          id?: string
          ocr_confidence?: number | null
          paid?: boolean | null
          paid_date?: string | null
          provider?: string | null
          source_file_url?: string | null
          user_id?: string
          utility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_utility_bills_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_welcome_tasks: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
          user_email: string
          user_full_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          user_email: string
          user_full_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          user_email?: string
          user_full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ussd_screenshot_validations: {
        Row: {
          cni_name: string | null
          created_at: string | null
          extracted_account_status: string | null
          extracted_balance: number | null
          extracted_name: string | null
          extracted_phone: string | null
          id: string
          image_hash: string | null
          is_name_match: boolean | null
          name_match_score: number | null
          ocr_confidence: number | null
          phone_number: string
          processed_at: string | null
          provider_detected: string | null
          rejection_reason: string | null
          screen_type: string | null
          tampering_probability: number | null
          ui_authenticity_score: number | null
          user_id: string | null
          validation_status: string | null
        }
        Insert: {
          cni_name?: string | null
          created_at?: string | null
          extracted_account_status?: string | null
          extracted_balance?: number | null
          extracted_name?: string | null
          extracted_phone?: string | null
          id?: string
          image_hash?: string | null
          is_name_match?: boolean | null
          name_match_score?: number | null
          ocr_confidence?: number | null
          phone_number: string
          processed_at?: string | null
          provider_detected?: string | null
          rejection_reason?: string | null
          screen_type?: string | null
          tampering_probability?: number | null
          ui_authenticity_score?: number | null
          user_id?: string | null
          validation_status?: string | null
        }
        Update: {
          cni_name?: string | null
          created_at?: string | null
          extracted_account_status?: string | null
          extracted_balance?: number | null
          extracted_name?: string | null
          extracted_phone?: string | null
          id?: string
          image_hash?: string | null
          is_name_match?: boolean | null
          name_match_score?: number | null
          ocr_confidence?: number | null
          phone_number?: string
          processed_at?: string | null
          provider_detected?: string | null
          rejection_reason?: string | null
          screen_type?: string | null
          tampering_probability?: number | null
          ui_authenticity_score?: number | null
          user_id?: string | null
          validation_status?: string | null
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
      add_access_password: {
        Args: { p_label: string; p_password: string }
        Returns: string
      }
      ban_ip: {
        Args: {
          p_duration_hours?: number
          p_ip_address: string
          p_reason: string
          p_trigger_details?: Json
          p_trigger_endpoint?: string
        }
        Returns: string
      }
      calculate_phone_trust_score: {
        Args: { p_phone_number: string }
        Returns: number
      }
      calculate_sla_deadline: { Args: { p_ticket_id: string }; Returns: Json }
      check_borrower_credits:
        | { Args: { p_user_id: string }; Returns: number }
        | {
            Args: { p_credit_type: string; p_user_id: string }
            Returns: number
          }
      check_password_hash: {
        Args: { input_password: string; stored_hash: string }
        Returns: boolean
      }
      check_recertifications_available: {
        Args: { p_user_id: string }
        Returns: {
          can_recertify: boolean
          recertifications_remaining: number
          subscription_id: string
        }[]
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      consume_borrower_credit: {
        Args: { p_credit_type?: string; p_user_id: string }
        Returns: boolean
      }
      consume_recertification: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: boolean
      }
      consume_share_quota: {
        Args: { p_certificate_id: string; p_user_id: string }
        Returns: Json
      }
      fuzzy_name_match: {
        Args: { name1: string; name2: string }
        Returns: number
      }
      generate_share_code: { Args: never; Returns: string }
      get_active_certificate: {
        Args: { p_user_id: string }
        Returns: {
          certainty_coefficient: number
          days_remaining: number
          id: string
          is_expired: boolean
          plan_id: string
          score: number
          share_code: string
          trust_level: string
          valid_from: string
          valid_until: string
        }[]
      }
      get_feature_emergency_message: {
        Args: { p_feature_name: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_ticket_role: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_borrower: { Args: { _user_id: string }; Returns: boolean }
      is_bot_user_agent: { Args: { p_user_agent: string }; Returns: boolean }
      is_feature_active: { Args: { p_feature_name: string }; Returns: boolean }
      is_ip_banned: { Args: { p_ip_address: string }; Returns: boolean }
      is_partner: { Args: { _user_id: string }; Returns: boolean }
      run_integrity_check: {
        Args: { p_time_window_minutes?: number }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "ANALYSTE"
        | "ENTREPRISE"
        | "API_CLIENT"
        | "PARTENAIRE"
        | "EMPRUNTEUR"
      ticket_category:
        | "technical"
        | "billing"
        | "score_dispute"
        | "identity"
        | "general"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "new"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
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
        "SUPER_ADMIN",
        "ANALYSTE",
        "ENTREPRISE",
        "API_CLIENT",
        "PARTENAIRE",
        "EMPRUNTEUR",
      ],
      ticket_category: [
        "technical",
        "billing",
        "score_dispute",
        "identity",
        "general",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "new",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
    },
  },
} as const
