import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { SettingsForm } from '@/components/SettingsForm';
import { Skeleton } from '@/components/ui/skeleton';

export function Settings() {
  const { user: authUser, userData, loading } = useAuth();
  
  // Combine auth user data (like email) with firestore user data
  const combinedUser = {
    ...authUser,
    ...userData,
    email: authUser?.email || userData?.email || ''
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie suas preferências e dados da conta.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : (
        <SettingsForm user={combinedUser} />
      )}
    </div>
  );
}
