import React from 'react'
import { motion } from 'framer-motion'

interface Props {
  count: number
  emoji: string
  label: string
}

export default function StreakCounter({ count, emoji, label }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center bg-[#1A1A2E] rounded-2xl p-4 gap-1"
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-2xl">{emoji}</span>
      <motion.span
        key={count}
        className="font-mono text-3xl font-bold text-[#E94560]"
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {count}
      </motion.span>
      <span className="text-xs text-[#B0BEC5]">{label}</span>
    </motion.div>
  )
}
