export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          created_at: string
          name: string
          category: string
          supplier: string
          agency: string
          quantity: number
          unit: string
          expiry_date: string | null
          image_url: string | null
          user_id: string
          unit_price: number | null
          total_price: number | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          category: string
          supplier: string
          agency: string
          quantity: number
          unit: string
          expiry_date?: string | null
          image_url?: string | null
          user_id: string
          unit_price?: number | null
          total_price?: number | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          category?: string
          supplier?: string
          agency?: string
          quantity?: number
          unit?: string
          expiry_date?: string | null
          image_url?: string | null
          user_id?: string
          unit_price?: number | null
          total_price?: number | null
          description?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      agencies: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
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
  }
}