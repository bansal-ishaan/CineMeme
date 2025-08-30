'use client'

import { motion } from 'framer-motion'

export function BackgroundAnimation() {
  const blobs = [
    { size: 400, color: 'rgba(0, 255, 255, 0.15)', x: '-30%', y: '-20%' },
    { size: 500, color: 'rgba(0, 200, 255, 0.12)', x: '50%', y: '0%' },
    { size: 350, color: 'rgba(0, 255, 180, 0.1)', x: '0%', y: '40%' }
  ]

  return (
    <div className="absolute inset-0 overflow-hidden">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl"
          style={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
            top: blob.y,
            left: blob.x,
          }}
          animate={{
            x: ['-5%', '5%', '-5%'],
            y: ['-5%', '5%', '-5%'],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
