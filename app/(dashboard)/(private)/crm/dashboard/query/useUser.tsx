'use client';

import { useAuthContext } from './AuthContext';

export function useUser() {
  const { user, isLoading, getUser } = useAuthContext();
  return { user, loading: isLoading, getUser };
}
