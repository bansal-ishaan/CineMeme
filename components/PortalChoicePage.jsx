"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Clapperboard, Film, Users } from "lucide-react"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"

export default function PortalChoicePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 text-white overflow-hidden bg-black">
      {/* Base blob background */}
      <BackgroundAnimation />

      {/* Extra cinematic overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none"></div>

      {/* Moving film reel shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: "110vw", opacity: 0.2 }}
            transition={{
              duration: 15 + i * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 1.5,
              ease: "linear",
            }}
            className="absolute w-40 h-40 border-4 border-dotted border-cyan-400/20 rounded-full"
            style={{
              top: `${(i * 10) % 100}%`,
              rotate: `${i * 36}deg`,
            }}
          />
        ))}
      </div>

      {/* Film dust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.5, 0] }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 6,
              ease: "linear",
            }}
            className="absolute w-1 h-1 bg-white/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="text-center w-full max-w-4xl z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Title Section */}
        <motion.div variants={itemVariants} className="mb-12">
          <Clapperboard className="h-14 w-14 mx-auto text-cyan-300 drop-shadow-lg animate-pulse" />
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mt-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent drop-shadow">
            CINEVAULT
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto mt-4 italic">
            The future of film is here — step into your portal and start your cinematic journey.
          </p>
        </motion.div>

        {/* Portal Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Creator Portal */}
          <Link href="/profile" passHref className="group">
            <div className="relative bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-teal-400 group-hover:bg-gray-800 shadow-lg hover:shadow-cyan-500/30">
              <Film className="h-16 w-16 text-teal-400 mb-6 transition-transform duration-300 group-hover:scale-110" />
              <h2 className="text-3xl font-bold mb-2">Creator Portal</h2>
              <p className="text-gray-400 text-base">Upload movies, track rentals, and manage your profile.</p>
              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-teal-400/40"></div>
            </div>
          </Link>

          {/* Viewer Portal */}
          <Link href="/explore" passHref className="group">
            <div className="relative bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-gray-800 shadow-lg hover:shadow-cyan-500/30">
              <Users className="h-16 w-16 text-cyan-400 mb-6 transition-transform duration-300 group-hover:scale-110" />
              <h2 className="text-3xl font-bold mb-2">Viewer Portal</h2>
              <p className="text-gray-400 text-base">Explore films, rent your favorites, and view your history.</p>
              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-cyan-400/40"></div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
