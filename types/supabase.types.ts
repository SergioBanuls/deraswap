/**
 * Supabase Database Types
 * 
 * Auto-generated types for Supabase database schema.
 * These types will be updated once the database is fully configured.
 * 
 * TODO: Generate these types using: npx supabase gen types typescript
 */

export interface Database {
  public: {
    Tables: {
      swap_history: {
        Row: {
          id: string
          wallet_address: string
          tx_hash: string
          from_token_address: string
          to_token_address: string
          from_amount: string
          to_amount: string
          usd_value: number
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          tx_hash: string
          from_token_address: string
          to_token_address: string
          from_amount: string
          to_amount: string
          usd_value: number
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          tx_hash?: string
          from_token_address?: string
          to_token_address?: string
          from_amount?: string
          to_amount?: string
          usd_value?: number
          timestamp?: string
          created_at?: string
        }
      }
      user_incentives: {
        Row: {
          id: string
          wallet_address: string
          total_swapped_usd: number
          nft_minted: boolean
          nft_token_id: string | null
          nft_serial_number: string | null
          nft_minted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          total_swapped_usd?: number
          nft_minted?: boolean
          nft_token_id?: string | null
          nft_serial_number?: string | null
          nft_minted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          total_swapped_usd?: number
          nft_minted?: boolean
          nft_token_id?: string | null
          nft_serial_number?: string | null
          nft_minted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
