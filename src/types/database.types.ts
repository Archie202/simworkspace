
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "application_staff_notes": {
                  Row: {
                    "application_id": string,"author_id": string,"created_at": string,"id": string,"is_private": boolean,"note": string,"organization_id": string,"score": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"author_id": string,"created_at"?: string,"id"?: string,"is_private"?: boolean,"note": string,"organization_id": string,"score"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "application_id"?: string,"author_id"?: string,"created_at"?: string,"id"?: string,"is_private"?: boolean,"note"?: string,"organization_id"?: string,"score"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_staff_notes_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_staff_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_staff_notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "applicant_id": string,"attempt_number": number,"cohort_id": string,"company_id": string,"cover_note": string | null,"created_at": string,"cv_path": string,"decided_at": string | null,"decided_by": string | null,"feedback_to_applicant": string | null,"id": string,"job_posting_id": string,"organization_id": string,"overridden_by": string | null,"override_reason": string | null,"screening_notes": string | null,"screening_score": number | null,"status": Database["public"]['Enums']["application_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_id": string,"attempt_number"?: number,"cohort_id": string,"company_id": string,"cover_note"?: string | null,"created_at"?: string,"cv_path": string,"decided_at"?: string | null,"decided_by"?: string | null,"feedback_to_applicant"?: string | null,"id"?: string,"job_posting_id": string,"organization_id": string,"overridden_by"?: string | null,"override_reason"?: string | null,"screening_notes"?: string | null,"screening_score"?: number | null,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Update: {
                    "applicant_id"?: string,"attempt_number"?: number,"cohort_id"?: string,"company_id"?: string,"cover_note"?: string | null,"created_at"?: string,"cv_path"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"feedback_to_applicant"?: string | null,"id"?: string,"job_posting_id"?: string,"organization_id"?: string,"overridden_by"?: string | null,"override_reason"?: string | null,"screening_notes"?: string | null,"screening_score"?: number | null,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_job_posting_id_fkey"
      columns: ["job_posting_id"]
isOneToOne: false
      referencedRelation: "job_postings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_overridden_by_fkey"
      columns: ["overridden_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance": {
                  Row: {
                    "absence_reason": string | null,"clock_in_at": string | null,"clock_out_at": string | null,"cohort_id": string,"confirmed_by": string | null,"created_at": string,"edited_at": string | null,"edited_by": string | null,"id": string,"minutes_worked": number | null,"organization_id": string,"profile_id": string,"status": Database["public"]['Enums']["attendance_status"],"updated_at": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "absence_reason"?: string | null,"clock_in_at"?: string | null,"clock_out_at"?: string | null,"cohort_id": string,"confirmed_by"?: string | null,"created_at"?: string,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"minutes_worked"?: number | null,"organization_id": string,"profile_id": string,"status"?: Database["public"]['Enums']["attendance_status"],"updated_at"?: string,"work_date": string
                  }
                  Update: {
                    "absence_reason"?: string | null,"clock_in_at"?: string | null,"clock_out_at"?: string | null,"cohort_id"?: string,"confirmed_by"?: string | null,"created_at"?: string,"edited_at"?: string | null,"edited_by"?: string | null,"id"?: string,"minutes_worked"?: number | null,"organization_id"?: string,"profile_id"?: string,"status"?: Database["public"]['Enums']["attendance_status"],"updated_at"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_confirmed_by_fkey"
      columns: ["confirmed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_edited_by_fkey"
      columns: ["edited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": Json | null,"id": number,"organization_id": string | null,"record_id": string | null,"table_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: Json | null,"id"?: number,"organization_id"?: string | null,"record_id"?: string | null,"table_name"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: Json | null,"id"?: number,"organization_id"?: string | null,"record_id"?: string | null,"table_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_log_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"channel_members": {
                  Row: {
                    "channel_id": string,"id": string,"joined_at": string,"organization_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel_id": string,"id"?: string,"joined_at"?: string,"organization_id": string,"profile_id": string
                  }
                  Update: {
                    "channel_id"?: string,"id"?: string,"joined_at"?: string,"organization_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "channel_members_channel_id_fkey"
      columns: ["channel_id"]
isOneToOne: false
      referencedRelation: "channels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channel_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channel_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"channels": {
                  Row: {
                    "archived_at": string | null,"cohort_id": string,"company_id": string | null,"created_at": string,"created_by": string,"id": string,"kind": Database["public"]['Enums']["channel_kind"],"name": string,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"cohort_id": string,"company_id"?: string | null,"created_at"?: string,"created_by": string,"id"?: string,"kind": Database["public"]['Enums']["channel_kind"],"name": string,"organization_id": string
                  }
                  Update: {
                    "archived_at"?: string | null,"cohort_id"?: string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["channel_kind"],"name"?: string,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "channels_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channels_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channels_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channels_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"cohort_members": {
                  Row: {
                    "cohort_id": string,"cohort_role": string,"id": string,"joined_at": string,"organization_id": string,"profile_id": string,"status": string,"track": Database["public"]['Enums']["track"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"cohort_role": string,"id"?: string,"joined_at"?: string,"organization_id": string,"profile_id": string,"status"?: string,"track"?: Database["public"]['Enums']["track"] | null
                  }
                  Update: {
                    "cohort_id"?: string,"cohort_role"?: string,"id"?: string,"joined_at"?: string,"organization_id"?: string,"profile_id"?: string,"status"?: string,"track"?: Database["public"]['Enums']["track"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cohort_members_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cohort_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cohort_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cohorts": {
                  Row: {
                    "created_at": string,"created_by": string,"daily_hours_target": number,"end_date": string,"id": string,"name": string,"organization_id": string,"start_date": string,"status": Database["public"]['Enums']["cohort_status"],"work_start_time": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"daily_hours_target"?: number,"end_date": string,"id"?: string,"name": string,"organization_id": string,"start_date": string,"status"?: Database["public"]['Enums']["cohort_status"],"work_start_time"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"daily_hours_target"?: number,"end_date"?: string,"id"?: string,"name"?: string,"organization_id"?: string,"start_date"?: string,"status"?: Database["public"]['Enums']["cohort_status"],"work_start_time"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cohorts_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cohorts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "cohort_id": string,"created_at": string,"created_by": string,"culture": string | null,"description": string | null,"id": string,"industry": string | null,"logo_path": string | null,"name": string,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"created_at"?: string,"created_by": string,"culture"?: string | null,"description"?: string | null,"id"?: string,"industry"?: string | null,"logo_path"?: string | null,"name": string,"organization_id": string
                  }
                  Update: {
                    "cohort_id"?: string,"created_at"?: string,"created_by"?: string,"culture"?: string | null,"description"?: string | null,"id"?: string,"industry"?: string | null,"logo_path"?: string | null,"name"?: string,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "companies_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "companies_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "companies_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"company_members": {
                  Row: {
                    "cohort_id": string,"company_id": string,"ended_at": string | null,"function": Database["public"]['Enums']["company_function"],"id": string,"is_standin": boolean,"job_posting_id": string | null,"organization_id": string,"profile_id": string,"started_at": string,"title": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"company_id": string,"ended_at"?: string | null,"function": Database["public"]['Enums']["company_function"],"id"?: string,"is_standin"?: boolean,"job_posting_id"?: string | null,"organization_id": string,"profile_id": string,"started_at"?: string,"title"?: string | null
                  }
                  Update: {
                    "cohort_id"?: string,"company_id"?: string,"ended_at"?: string | null,"function"?: Database["public"]['Enums']["company_function"],"id"?: string,"is_standin"?: boolean,"job_posting_id"?: string | null,"organization_id"?: string,"profile_id"?: string,"started_at"?: string,"title"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_members_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_members_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consent_records": {
                  Row: {
                    "created_at": string,"evidence_path": string | null,"granted": boolean,"granted_at": string | null,"guardian_link_id": string | null,"id": string,"intern_id": string,"kind": Database["public"]['Enums']["consent_kind"],"organization_id": string,"recorded_by": string | null,"revoked_at": string | null,"text_version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"evidence_path"?: string | null,"granted"?: boolean,"granted_at"?: string | null,"guardian_link_id"?: string | null,"id"?: string,"intern_id": string,"kind": Database["public"]['Enums']["consent_kind"],"organization_id": string,"recorded_by"?: string | null,"revoked_at"?: string | null,"text_version": string
                  }
                  Update: {
                    "created_at"?: string,"evidence_path"?: string | null,"granted"?: boolean,"granted_at"?: string | null,"guardian_link_id"?: string | null,"id"?: string,"intern_id"?: string,"kind"?: Database["public"]['Enums']["consent_kind"],"organization_id"?: string,"recorded_by"?: string | null,"revoked_at"?: string | null,"text_version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consent_records_guardian_link_id_fkey"
      columns: ["guardian_link_id"]
isOneToOne: false
      referencedRelation: "guardian_links"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consent_records_intern_id_fkey"
      columns: ["intern_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consent_records_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consent_records_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"guardian_links": {
                  Row: {
                    "created_at": string,"guardian_email": string,"guardian_name": string,"guardian_profile_id": string | null,"id": string,"intern_id": string,"organization_id": string,"relationship": string,"status": string,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"guardian_email": string,"guardian_name": string,"guardian_profile_id"?: string | null,"id"?: string,"intern_id": string,"organization_id": string,"relationship": string,"status": string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"guardian_email"?: string,"guardian_name"?: string,"guardian_profile_id"?: string | null,"id"?: string,"intern_id"?: string,"organization_id"?: string,"relationship"?: string,"status"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "guardian_links_guardian_profile_id_fkey"
      columns: ["guardian_profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guardian_links_intern_id_fkey"
      columns: ["intern_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guardian_links_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"interview_staff_notes": {
                  Row: {
                    "author_id": string,"created_at": string,"id": string,"interview_id": string,"is_private": boolean,"note": string,"organization_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"created_at"?: string,"id"?: string,"interview_id": string,"is_private"?: boolean,"note": string,"organization_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"created_at"?: string,"id"?: string,"interview_id"?: string,"is_private"?: boolean,"note"?: string,"organization_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "interview_staff_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interview_staff_notes_interview_id_fkey"
      columns: ["interview_id"]
isOneToOne: false
      referencedRelation: "interviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interview_staff_notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"interviews": {
                  Row: {
                    "application_id": string,"cohort_id": string,"created_at": string,"duration_minutes": number,"feedback_to_applicant": string | null,"id": string,"interviewer_id": string,"meeting_url": string | null,"mode": Database["public"]['Enums']["interview_mode"],"organization_id": string,"private_notes": string | null,"rubric_id": string | null,"scheduled_at": string,"scores": Json | null,"second_adult_id": string | null,"status": Database["public"]['Enums']["interview_status"],"total_score": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"cohort_id": string,"created_at"?: string,"duration_minutes"?: number,"feedback_to_applicant"?: string | null,"id"?: string,"interviewer_id": string,"meeting_url"?: string | null,"mode": Database["public"]['Enums']["interview_mode"],"organization_id": string,"private_notes"?: string | null,"rubric_id"?: string | null,"scheduled_at": string,"scores"?: Json | null,"second_adult_id"?: string | null,"status"?: Database["public"]['Enums']["interview_status"],"total_score"?: number | null
                  }
                  Update: {
                    "application_id"?: string,"cohort_id"?: string,"created_at"?: string,"duration_minutes"?: number,"feedback_to_applicant"?: string | null,"id"?: string,"interviewer_id"?: string,"meeting_url"?: string | null,"mode"?: Database["public"]['Enums']["interview_mode"],"organization_id"?: string,"private_notes"?: string | null,"rubric_id"?: string | null,"scheduled_at"?: string,"scores"?: Json | null,"second_adult_id"?: string | null,"status"?: Database["public"]['Enums']["interview_status"],"total_score"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "interviews_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_interviewer_id_fkey"
      columns: ["interviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_second_adult_id_fkey"
      columns: ["second_adult_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"job_postings": {
                  Row: {
                    "cohort_id": string,"company_id": string,"created_at": string,"created_by": string,"description": string,"function": Database["public"]['Enums']["company_function"],"id": string,"openings": number,"organization_id": string,"requirements": string | null,"status": Database["public"]['Enums']["posting_status"],"title": string,"track": Database["public"]['Enums']["track"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"company_id": string,"created_at"?: string,"created_by": string,"description": string,"function": Database["public"]['Enums']["company_function"],"id"?: string,"openings"?: number,"organization_id": string,"requirements"?: string | null,"status"?: Database["public"]['Enums']["posting_status"],"title": string,"track": Database["public"]['Enums']["track"],"updated_at"?: string
                  }
                  Update: {
                    "cohort_id"?: string,"company_id"?: string,"created_at"?: string,"created_by"?: string,"description"?: string,"function"?: Database["public"]['Enums']["company_function"],"id"?: string,"openings"?: number,"organization_id"?: string,"requirements"?: string | null,"status"?: Database["public"]['Enums']["posting_status"],"title"?: string,"track"?: Database["public"]['Enums']["track"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_postings_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_postings_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_postings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_postings_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "attachment_paths": (string)[],"body": string,"channel_id": string,"cohort_id": string,"created_at": string,"deleted_at": string | null,"deleted_by": string | null,"edited_at": string | null,"flagged": boolean,"id": string,"organization_id": string,"reply_to_id": string | null,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_paths"?: (string)[],"body": string,"channel_id": string,"cohort_id": string,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"flagged"?: boolean,"id"?: string,"organization_id": string,"reply_to_id"?: string | null,"sender_id": string
                  }
                  Update: {
                    "attachment_paths"?: (string)[],"body"?: string,"channel_id"?: string,"cohort_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"deleted_by"?: string | null,"edited_at"?: string | null,"flagged"?: boolean,"id"?: string,"organization_id"?: string,"reply_to_id"?: string | null,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_channel_id_fkey"
      columns: ["channel_id"]
isOneToOne: false
      referencedRelation: "channels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_deleted_by_fkey"
      columns: ["deleted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_reply_to_id_fkey"
      columns: ["reply_to_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"kind": string,"link": string | null,"organization_id": string,"profile_id": string,"read_at": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"link"?: string | null,"organization_id": string,"profile_id": string,"read_at"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"link"?: string | null,"organization_id"?: string,"profile_id"?: string,"read_at"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"offers": {
                  Row: {
                    "application_id": string,"id": string,"offered_at": string,"offered_by": string,"organization_id": string,"responded_at": string | null,"response": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"id"?: string,"offered_at"?: string,"offered_by": string,"organization_id": string,"responded_at"?: string | null,"response"?: string
                  }
                  Update: {
                    "application_id"?: string,"id"?: string,"offered_at"?: string,"offered_by"?: string,"organization_id"?: string,"responded_at"?: string | null,"response"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "offers_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_offered_by_fkey"
      columns: ["offered_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding_checklist_items": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_confirmation_item": boolean,"order_index": number,"organization_id": string,"role": Database["public"]['Enums']["onboarding_item_role"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_confirmation_item"?: boolean,"order_index"?: number,"organization_id": string,"role": Database["public"]['Enums']["onboarding_item_role"],"title": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_confirmation_item"?: boolean,"order_index"?: number,"organization_id"?: string,"role"?: Database["public"]['Enums']["onboarding_item_role"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_checklist_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"onboarding_checklist_progress": {
                  Row: {
                    "checklist_item_id": string,"completed_at": string | null,"completed_by": string | null,"created_at": string,"id": string,"is_completed": boolean,"organization_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checklist_item_id": string,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"id"?: string,"is_completed"?: boolean,"organization_id": string,"profile_id": string
                  }
                  Update: {
                    "checklist_item_id"?: string,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"id"?: string,"is_completed"?: boolean,"organization_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "onboarding_checklist_progress_checklist_item_id_fkey"
      columns: ["checklist_item_id"]
isOneToOne: false
      referencedRelation: "onboarding_checklist_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "onboarding_checklist_progress_completed_by_fkey"
      columns: ["completed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "onboarding_checklist_progress_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "onboarding_checklist_progress_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"logo_path": string | null,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"logo_path"?: string | null,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"logo_path"?: string | null,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"bio": string | null,"created_at": string,"cv_path": string | null,"date_of_birth": string | null,"deleted_at": string | null,"display_name": string,"email": string,"full_name": string,"id": string,"organization_id": string,"phone": string | null,"status": Database["public"]['Enums']["account_status"],"track": Database["public"]['Enums']["track"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"bio"?: string | null,"created_at"?: string,"cv_path"?: string | null,"date_of_birth"?: string | null,"deleted_at"?: string | null,"display_name": string,"email": string,"full_name": string,"id"?: string,"organization_id": string,"phone"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"track"?: Database["public"]['Enums']["track"] | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"bio"?: string | null,"created_at"?: string,"cv_path"?: string | null,"date_of_birth"?: string | null,"deleted_at"?: string | null,"display_name"?: string,"email"?: string,"full_name"?: string,"id"?: string,"organization_id"?: string,"phone"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"track"?: Database["public"]['Enums']["track"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "cohort_id": string,"comments": string | null,"company_id": string,"created_at": string,"dispute_note": string | null,"disputed": boolean,"id": string,"organization_id": string,"outcome": Database["public"]['Enums']["review_outcome"],"reviewer_id": string,"rubric_scores": Json | null,"score": number | null,"submission_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cohort_id": string,"comments"?: string | null,"company_id": string,"created_at"?: string,"dispute_note"?: string | null,"disputed"?: boolean,"id"?: string,"organization_id": string,"outcome": Database["public"]['Enums']["review_outcome"],"reviewer_id": string,"rubric_scores"?: Json | null,"score"?: number | null,"submission_id": string
                  }
                  Update: {
                    "cohort_id"?: string,"comments"?: string | null,"company_id"?: string,"created_at"?: string,"dispute_note"?: string | null,"disputed"?: boolean,"id"?: string,"organization_id"?: string,"outcome"?: Database["public"]['Enums']["review_outcome"],"reviewer_id"?: string,"rubric_scores"?: Json | null,"score"?: number | null,"submission_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_submission_id_fkey"
      columns: ["submission_id"]
isOneToOne: false
      referencedRelation: "submissions"
      referencedColumns: ["id"]
    }
                  ]
                },"rubrics": {
                  Row: {
                    "created_at": string,"created_by": string,"criteria": NonNullable<Json>,"id": string,"kind": string,"name": string,"organization_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"criteria"?: NonNullable<Json>,"id"?: string,"kind": string,"name": string,"organization_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"criteria"?: NonNullable<Json>,"id"?: string,"kind"?: string,"name"?: string,"organization_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rubrics_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rubrics_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"submissions": {
                  Row: {
                    "author_id": string,"cohort_id": string,"company_id": string,"file_paths": (string)[],"id": string,"links": (string)[],"note": string | null,"organization_id": string,"submitted_at": string,"task_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"cohort_id": string,"company_id": string,"file_paths"?: (string)[],"id"?: string,"links"?: (string)[],"note"?: string | null,"organization_id": string,"submitted_at"?: string,"task_id": string,"version"?: number
                  }
                  Update: {
                    "author_id"?: string,"cohort_id"?: string,"company_id"?: string,"file_paths"?: (string)[],"id"?: string,"links"?: (string)[],"note"?: string | null,"organization_id"?: string,"submitted_at"?: string,"task_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"task_templates": {
                  Row: {
                    "created_at": string,"created_by": string,"description": string | null,"difficulty": number,"estimated_minutes": number | null,"id": string,"organization_id": string,"rubric_id": string | null,"source": string,"title": string,"track": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"description"?: string | null,"difficulty"?: number,"estimated_minutes"?: number | null,"id"?: string,"organization_id": string,"rubric_id"?: string | null,"source"?: string,"title": string,"track": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"description"?: string | null,"difficulty"?: number,"estimated_minutes"?: number | null,"id"?: string,"organization_id"?: string,"rubric_id"?: string | null,"source"?: string,"title"?: string,"track"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_templates_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_templates_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_templates_rubric_id_fkey"
      columns: ["rubric_id"]
isOneToOne: false
      referencedRelation: "rubrics"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"cohort_id": string,"company_id": string,"created_at": string,"created_by": string,"description": string | null,"due_at": string | null,"id": string,"organization_id": string,"position": number,"priority": Database["public"]['Enums']["priority"],"rubric_id": string | null,"status": Database["public"]['Enums']["task_status"],"template_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"cohort_id": string,"company_id": string,"created_at"?: string,"created_by": string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"organization_id": string,"position"?: number,"priority"?: Database["public"]['Enums']["priority"],"rubric_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"template_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"cohort_id"?: string,"company_id"?: string,"created_at"?: string,"created_by"?: string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"organization_id"?: string,"position"?: number,"priority"?: Database["public"]['Enums']["priority"],"rubric_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"template_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_cohort_id_fkey"
      columns: ["cohort_id"]
isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"id": string,"is_safeguarding_lead": boolean,"organization_id": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_safeguarding_lead"?: boolean,"organization_id": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_safeguarding_lead"?: boolean,"organization_id"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_roles_user_id_fkey"
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
            [_ in never]: never
          }
          Enums: {
            "account_status": "invited"|"pending_consent"|"active"|"suspended"|"left","app_role": "platform_admin"|"school_admin"|"trainer"|"employer"|"guardian"|"intern","application_status": "submitted"|"screening"|"interview"|"offered"|"accepted"|"rejected"|"withdrawn","attendance_status": "present"|"late"|"absent"|"excused","channel_kind": "company"|"team"|"announcement"|"group"|"direct","cohort_status": "draft"|"hiring"|"active"|"completed","company_function": "intern"|"hr"|"manager","consent_kind": "guardian_consent"|"code_of_conduct"|"privacy_notice"|"record_sharing","interview_mode": "chat"|"audio"|"video","interview_status": "scheduled"|"done"|"cancelled"|"no_show","onboarding_item_role": "intern"|"hr"|"manager"|"trainer","posting_status": "draft"|"open"|"filled"|"closed","priority": "low"|"medium"|"high","review_outcome": "approved"|"changes_requested"|"rejected","task_status": "todo"|"in_progress"|"in_review"|"changes_requested"|"done","track": "software_development"|"data_analytics"|"program_management"|"hr"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["invited", "pending_consent", "active", "suspended", "left"],"app_role": ["platform_admin", "school_admin", "trainer", "employer", "guardian", "intern"],"application_status": ["submitted", "screening", "interview", "offered", "accepted", "rejected", "withdrawn"],"attendance_status": ["present", "late", "absent", "excused"],"channel_kind": ["company", "team", "announcement", "group", "direct"],"cohort_status": ["draft", "hiring", "active", "completed"],"company_function": ["intern", "hr", "manager"],"consent_kind": ["guardian_consent", "code_of_conduct", "privacy_notice", "record_sharing"],"interview_mode": ["chat", "audio", "video"],"interview_status": ["scheduled", "done", "cancelled", "no_show"],"onboarding_item_role": ["intern", "hr", "manager", "trainer"],"posting_status": ["draft", "open", "filled", "closed"],"priority": ["low", "medium", "high"],"review_outcome": ["approved", "changes_requested", "rejected"],"task_status": ["todo", "in_progress", "in_review", "changes_requested", "done"],"track": ["software_development", "data_analytics", "program_management", "hr"]
          }
        }
} as const
