// src/components/common/DemoBanner.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoBannerProps {
  demoMode: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ demoMode }) => {
  if (!demoMode) return null;

  return (
    <div className="demo-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} />
        <span>
          <strong>Modo Demo Local:</strong> Usando inventario simulado. Las credenciales de Google Sheets no están configuradas.
        </span>
      </div>
    </div>
  );
};
