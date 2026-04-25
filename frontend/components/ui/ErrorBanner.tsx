'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
}

export function ErrorBanner({ 
  message, 
  onRetry, 
  onDismiss, 
  showRetry = true 
}: ErrorBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{message}</p>
            <div className="flex gap-2 mt-2">
              {showRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
