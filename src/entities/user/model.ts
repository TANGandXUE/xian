import { StringDimensions } from '@/entities/string-data/model';

export interface WatchRecord {
  videoId: string;
  category: string;
  watchPercent: number;
  duration: number;
  liked: boolean;
  commented: boolean;
  watchedAt: string;
  isNightWatch: boolean;
  comment?: string;
}

export interface UserMeta {
  isNewUser: boolean;
  isSilentUser: boolean;
  isActiveUser: boolean;
  isSinglePref: boolean;
  isNightOwl: boolean;
}

export interface RawUser {
  id: string;
  nickname: string;
  avatar: string;
  personaType: string;
  watchHistory: WatchRecord[];
  createdAt: string;
  _meta: UserMeta;
}

export interface ProcessedUser {
  id: string;
  nickname: string;
  avatar: string;
  personaType: string;
  dimensions: StringDimensions;
  watchHistory: WatchRecord[];
  meta: UserMeta;
}
