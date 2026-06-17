import React, { memo, useMemo } from 'react'

export const ParticleField = memo(function ParticleField() {
  const particles = useMemo(
    () => Array.from({ length: 58 }, (_, index) => ({
      id: index,
      x: (index * 37) % 100,
      y: (index * 53) % 100,
      size: 3 + (index % 5),
      delay: (index % 11) * 0.36,
      duration: 7 + (index % 7) * 0.62,
    })),
    [],
  )

  return (
    <div className="twin-particle-field" aria-hidden="true">
      {particles.map(particle => (
        <span
          key={particle.id}
          style={{
            '--particle-x': `${particle.x}%`,
            '--particle-y': `${particle.y}%`,
            '--particle-size': `${particle.size}px`,
            '--particle-delay': `${particle.delay}s`,
            '--particle-duration': `${particle.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
})
