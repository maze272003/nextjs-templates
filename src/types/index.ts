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
    content: string | null; // Can be null for files
    sender_id: number;
    receiver_id?: number;
    username: string;
    created_at: string;
    profile_picture_url: string | null;
    message_type: 'text' | 'image' | 'video' | 'file'; // New type field
    file_url: string | null; // New field for the file path
}