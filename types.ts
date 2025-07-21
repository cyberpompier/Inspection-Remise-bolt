import type { Database } from './services/database.types';

export type VehicleSide = 'avant' | 'droite' | 'arriere' | 'gauche';

export interface Defect {
  id: string;
  side: VehicleSide;
  x: number; // percentage
  y: number; // percentage
  title: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export type UserProfile = Database['public']['Tables']['user_profile']['Row'];

export type UserProfileUpdate = Database['public']['Tables']['user_profile']['Update'];

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];

export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export type VehicleWithPublicUrls = Vehicle & {
  image_avant_url: string | null;
  image_droite_url: string | null;
  image_arriere_url: string | null;
  image_gauche_url: string | null;
};
