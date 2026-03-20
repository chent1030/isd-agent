import React from 'react'
import { useSkillsStore } from '../../store/skillsStore'

export default function SkillsPanel() {
  const skills = useSkillsStore(s => s.skills)

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* 标题 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 4, height: 14, borderRadius: 2,
          background: 'linear-gradient(180deg, var(--cyan), var(--blue))',
          boxShadow: '0 0 8px var(--cyan-dim)',
        }} />
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 11, letterSpacing: '0.25em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Skills
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontFamily: 'Rajdhani',
          padding: '1px 6px', borderRadius: 3,
          background: 'rgba(0,212,255,0.08)', border: '1px solid var(--cyan-dim)',
          color: 'var(--cyan)',
        }}>{skills.length}</span>
      </div>

      {/* 说明 */}
      <div style={{
        fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6,
        marginBottom: 12, padding: '6px 8px', borderRadius: 4,
        background: 'rgba(0,212,255,0.03)', border: '1px solid var(--border)',
        fontFamily: 'Rajdhani', letterSpacing: '0.05em',
      }}>
        对话时 AI 会自动调用合适的技能
      </div>

      {skills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}>
          暂无可用技能
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {skills.map((skill, idx) => (
            <div
              key={skill.name}
              className="skill-card"
              style={{
                padding: '10px 12px', borderRadius: 6,
                animation: `float-up 0.3s ease ${idx * 0.05}s both`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan-dim)',
                  flexShrink: 0,
                }} />
                <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '0.05em' }}>
                  {skill.name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: 14 }}>
                {skill.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
