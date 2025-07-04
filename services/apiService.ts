import { supabase } from './authService'; // We can reuse the initialized client
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const invoke = async (functionName: string, options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: { [key: string]: string };
  body?: any;
}) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    ...options,
    headers,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// User Profile API
export const getUserProfile = () => invoke('user-profile', { method: 'GET' });
export const updateUserProfile = (profileData: any) => invoke('user-profile', { method: 'PUT', body: profileData });

// Polls API
export const getPolls = () => invoke('polls', { method: 'GET' });
export const getPollById = (id: string) => invoke(`polls?id=${id}`, { method: 'GET' });
export const getPollsByWard = (wardId: number) => invoke(`get-polls-by-ward?ward_id=${wardId}`, { method: 'GET' });
export const createPoll = (pollData: any) => invoke('polls', { method: 'POST', body: pollData });
export const updatePoll = (id: string, pollData: any) => invoke(`polls?id=${id}`, { method: 'PUT', body: pollData });
export const deletePoll = (id: string) => invoke(`polls?id=${id}`, { method: 'DELETE' });

// Vote API
export const castVote = (voteData: { poll_id: number, option_id: number }) => invoke('vote', { method: 'POST', body: voteData });

// Comments API
export const getComments = (pollId: string) => invoke(`comments?poll_id=${pollId}`, { method: 'GET' });
export const createComment = (commentData: any) => invoke('comments', { method: 'POST', body: commentData });
export const updateComment = (id: string, commentData: any) => invoke(`comments?id=${id}`, { method: 'PUT', body: commentData });
export const deleteComment = (id: string) => invoke(`comments?id=${id}`, { method: 'DELETE' });

// Image Upload API
export const uploadPollImage = async (imageUri: string) => {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);
  const { data, error } = await supabase.storage
    .from('poll_images')
    .upload(`public/${Date.now()}.jpg`, arrayBuffer, {
      contentType: 'image/jpeg',
    });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Ward API
export const getWardFromCoords = (lat: number, lon: number) => invoke('get-ward-from-coords', { method: 'POST', body: { lat, lon } }); 