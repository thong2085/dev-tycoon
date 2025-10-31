'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface ParticleEffectProps {
  trigger: number; // Increment this to trigger a new particle
  text?: string;
  color?: string;
}

export default function ParticleEffect({ trigger, text = '+$', color = 'text-green-400' }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const newParticle: Particle = {
      id: Date.now(),
      x: Math.random() * 100 - 50, // -50 to 50
      y: 0,
      text,
      color,
    };

    setParticles(prev => [...prev, newParticle]);

    // Remove particle after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 2000);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute top-1/2 left-1/2 font-bold text-xl ${particle.color} animate-float-up`}
          style={{
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            animation: 'floatUp 2s ease-out forwards',
          }}
        >
          {particle.text}
        </div>
      ))}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translate(${particles[particles.length - 1]?.x || 0}px, 0px);
            opacity: 1;
          }
          100% {
            transform: translate(${particles[particles.length - 1]?.x || 0}px, -100px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

