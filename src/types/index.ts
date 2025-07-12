// src/types/index.ts

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

export interface SelectedUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

export interface Message {
  id: number | string;
  content: string;
  sender_id: number;
  receiver_id?: number; // Optional, useful for backend
  username: string;
  created_at: string;
  profile_picture_url: string | null;
}