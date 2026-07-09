import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { GlassCard } from './ui';

export const UserStories = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="py-24 px-4 md:px-8 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-cyan-900/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold mb-6">Un giorno con la tua nuova dashboard</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Scopri come HA Dashboard Builder trasforma la gestione della tua smart home, dal risveglio fino al controllo notturno della sicurezza, con un'interfaccia premium che si adatta alle tue abitudini.
          </p>
        </div>

        <div className="relative group cursor-pointer max-w-5xl mx-auto" onClick={togglePlay}>
          {/* Decorative glow behind video */}
          <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-[36px] -z-10 transition-all duration-700 group-hover:bg-cyan-500/30"></div>
          
          <GlassCard className="relative overflow-hidden aspect-video rounded-[24px] md:rounded-[36px] border-white/10 group-hover:border-white/20 transition-all duration-500 shadow-2xl">
            {/* The actual video element */}
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover z-0"
              src="/demo-video1.mp4?v=2" 
              loop
              playsInline
              onEnded={() => setIsPlaying(false)}
            />

            {/* Video Thumbnail Background (CSS gradient placeholder for video when not loaded or before playing) */}
            <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0a1128] to-gray-900 transition-opacity duration-700 ${isPlaying ? 'opacity-0' : 'opacity-100'} -z-10`}>
               {/* Subtle grid pattern overlay */}
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
            </div>

            {/* Simulated UI elements floating in the background for a cinematic feel */}
            {!isPlaying && (
              <>
                <div className="absolute top-1/4 left-[15%] w-48 h-32 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 transform -rotate-6 opacity-40 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3 pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-[15%] w-56 h-36 bg-cyan-500/10 backdrop-blur-md rounded-2xl border border-cyan-500/20 transform rotate-12 opacity-30 transition-transform duration-700 group-hover:scale-105 group-hover:rotate-6 pointer-events-none"></div>
                <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-purple-500/10 backdrop-blur-3xl rounded-full blur-[40px] opacity-50 pointer-events-none"></div>
              </>
            )}

            {/* Play/Pause Button Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
              >
                {!isPlaying && <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-20"></div>}
                {isPlaying ? (
                  <Pause className="w-8 h-8 md:w-12 md:h-12 text-white" fill="currentColor" />
                ) : (
                  <Play className="w-8 h-8 md:w-12 md:h-12 text-white ml-2" fill="currentColor" />
                )}
              </motion.div>
            </div>

            {/* Video Label */}
            <div className={`absolute bottom-6 left-6 md:bottom-10 md:left-10 flex items-center gap-4 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
              <span className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white/90 text-sm font-medium border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                A Day in the Life
              </span>
              <span className="text-white/60 text-sm font-medium tracking-wide">
                2:15
              </span>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
