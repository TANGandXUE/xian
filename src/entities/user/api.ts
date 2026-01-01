import { RawUser, ProcessedUser } from './model';
import { calculateDimensions } from '@/features/visualization/lib/dimension-calculator';

/**
 * 处理原始用户数据，计算维度
 */
export function processUser(raw: RawUser): ProcessedUser {
  return {
    id: raw.id,
    nickname: raw.nickname,
    avatar: raw.avatar,
    personaType: raw.personaType,
    dimensions: calculateDimensions(raw.watchHistory),
    watchHistory: raw.watchHistory,
    meta: raw._meta,
  };
}

/**
 * 处理用户列表
 */
export function processUsers(rawUsers: RawUser[]): ProcessedUser[] {
  return rawUsers.map(processUser);
}
