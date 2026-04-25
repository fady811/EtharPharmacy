import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={cn('border-4 border-primary-200 border-t-primary-600 rounded-full', sizes[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('bg-gray-200 rounded animate-pulse', className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
