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
      user_profile: {
        Row: {
          id: number
          user_id: string
          name: string | null
          rank: string | null
          matricule: string | null
          caserne: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: number
          user_id: string
          name?: string | null
          rank?: string | null
          matricule?: string | null
          caserne?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          name?: string | null
          rank?: string | null
          matricule?: string | null
          caserne?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          id: number
          name: string
          image_avant_path: string | null
          image_droite_path: string | null
          image_arriere_path: string | null
          image_gauche_path: string | null
          created_at: string | null
          caserne: string | null
        }
        Insert: {
          id?: number
          name: string
          image_avant_path?: string | null
          image_droite_path?: string | null
          image_arriere_path?: string | null
          image_gauche_path?: string | null
          created_at?: string | null
          caserne?: string | null
        }
        Update: {
          id?: number
          name?: string
          image_avant_path?: string | null
          image_droite_path?: string | null
          image_arriere_path?: string | null
          image_gauche_path?: string | null
          created_at?: string | null
          caserne?: string | null
        }
        Relationships: []
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
