// frontend/src/components/UnlockedBadge.tsx
import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface UnlockedBadgeProps {
  isUnlocked?: boolean;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const UnlockedBadge: React.FC<UnlockedBadgeProps> = ({
  isUnlocked,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
  }[size];

  const iconSize = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  if (isUnlocked) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        title="You have unlocked this candidate's profile"
      >
        <Unlock className={iconSize} strokeWidth={2.5} />
        {showLabel && 'Unlocked'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full bg-[#F0ECF5] text-[#6F687A] border border-[#E8E3EF] ${sizeClasses} ${className}`}
      title="Profile locked — purchase to unlock full details"
    >
      <Lock className={iconSize} strokeWidth={2.5} />
      {showLabel && 'Locked'}
    </span>
  );
};

export default UnlockedBadge;