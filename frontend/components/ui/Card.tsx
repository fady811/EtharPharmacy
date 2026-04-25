import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const MotionComponent = onClick ? motion.div : 'div';
  
  return (
    <MotionComponent
      className={cn(
        'rounded-lg bg-white shadow-md overflow-hidden',
        hover && 'hover:shadow-xl transition-shadow duration-300',
        className
      )}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
    >
      {children}
    </MotionComponent>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4 border-b border-gray-200', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-200', className)}>{children}</div>;
}
