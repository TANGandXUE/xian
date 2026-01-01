'use client';

import { useState, useEffect } from 'react';
import { ProcessedUser } from './model';

interface UseUsersResult {
  users: ProcessedUser[];
  loading: boolean;
  error: string | null;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<ProcessedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users/online');
        const result = await response.json();

        if (result.success) {
          setUsers(result.data);
        } else {
          setError(result.error || 'Failed to load users');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading, error };
}
