import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { TableSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { DossierContent } from '@/components/DossierContent';
import { useClientDossier } from '@/hooks/useClientDossier';

interface ClientResultsProps {
  userId: string;
}

export function ClientResults({ userId }: ClientResultsProps) {
  const { userData: currentUserProfile } = useAuth();
  const { data, isLoading } = useClientDossier(userId) as { data: any, isLoading: boolean };

  if (isLoading) return <TableSkeleton />;
  if (!data || !data.profile) return <div className="p-8 text-center text-slate-500">Usuário não encontrado ou sem dados para exibir.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
            {data.profile.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{data.profile.name}</h2>
            <p className="text-sm text-slate-500">{data.profile.email}</p>
          </div>
        </div>
        <ExportPdfButton 
          targetId="dossier-content" 
          filename={`dossie-${data.profile.name?.replace(/\s+/g, '-').toLowerCase()}`} 
          title="Dossiê Consolidado do Cliente"
          userName={data.profile.name}
        />
      </div>

      <DossierContent 
        data={data} 
        mentorName={currentUserProfile?.name} 
      />
    </div>
  );
}

