'use client';

interface Message {
  id: number | string;
  content: string;
  sender_id: number;
  username: string;
  created_at: string;
}

// Generates a consistent key for the conversation between two users.
const getConversationKey = (userId1: number, userId2: number): string => {
  return userId1 < userId2 
    ? `chat_${userId1}_${userId2}` 
    : `chat_${userId2}_${userId1}`;
};

// --- Public Functions ---

/**
 * Retrieves all messages for a specific conversation from local storage.
 */
export const getCachedMessages = (userId1: number, userId2: number): Message[] => {
  if (typeof window === 'undefined') return [];
  const key = getConversationKey(userId1, userId2);
  const storedMessages = localStorage.getItem(key);
  return storedMessages ? JSON.parse(storedMessages) : [];
};

/**
 * Adds a new message to an existing conversation cache in local storage.
 */
export const cacheMessage = (userId1: number, userId2: number, message: Message): void => {
  if (typeof window === 'undefined') return;
  const key = getConversationKey(userId1, userId2);
  const messages = getCachedMessages(userId1, userId2);
  messages.push(message);
  localStorage.setItem(key, JSON.stringify(messages));
};

/**
 * Retrieves all messages for a conversation and then clears them from local storage.
 * This is useful for when you're about to save them to the database.
 */
export const getAndClearCachedMessages = (userId1: number, userId2:number): Message[] => {
    if (typeof window === 'undefined') return [];
    const key = getConversationKey(userId1, userId2);
    const messages = getCachedMessages(userId1, userId2);
    localStorage.removeItem(key);
    return messages;
}