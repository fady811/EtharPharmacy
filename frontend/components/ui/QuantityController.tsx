'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface QuantityControllerProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function QuantityController({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max,
  disabled = false,
  size = 'md',
}: QuantityControllerProps) {
  const isSmall = size === 'sm';
  const btnSize = isSmall ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = isSmall ? 'text-sm w-7' : 'text-base w-8';

  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        className={`${btnSize} flex items-center justify-center rounded-md
          ${quantity <= min
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-white hover:shadow-sm'
          } transition-all duration-150`}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </motion.button>

      <motion.span
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`${textSize} text-center font-semibold text-gray-900 select-none`}
      >
        {quantity}
      </motion.span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onIncrease}
        disabled={disabled || (max !== undefined && quantity >= max)}
        className={`${btnSize} flex items-center justify-center rounded-md
          ${max !== undefined && quantity >= max
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }
          transition-all duration-150 disabled:text-gray-300 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <Plus className={iconSize} />
      </motion.button>
    </div>
  );
}
