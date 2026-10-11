'use client';

import React, { FC } from 'react';
import DetailedPricingProgress from './DetailedPricingProgress';

interface PricingLoadingOverlayProps {
  visible: boolean;
  applicationId: string;
  itemId: string;
}

/**
 * A fullscreen overlay that displays pricing progress
 */
const PricingLoadingOverlay: FC<PricingLoadingOverlayProps> = ({
  visible,
  applicationId,
  itemId,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg transform transition-all duration-300 ease-in-out">
        <DetailedPricingProgress 
          applicationId={applicationId}
          itemId={itemId}
        />
      </div>
    </div>
  );
};

export default PricingLoadingOverlay;