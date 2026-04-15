import React from 'react';
import { Star, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { SFX } from '../utils/mission';

const LEVELS = [
    {
        level: 1,
        label: 'Beginner',
        labelKo: '초급',
        color: '#4CAF50',
        bgColor: 'rgba(76,175,80,0.1)',
        icon: '🌱',
        desc: 'Short & simple verses',
        descKo: '짧고 쉬운 구절 (40자 이하)',
    },
    {
        level: 2,
        label: 'Intermediate',
        labelKo: '중급',
        color: '#FF9800',
        bgColor: 'rgba(255,152,0,0.1)',
        icon: '🔥',
        desc: 'Standard length verses',
        descKo: '표준 길이 구절 (41~80자)',
    },
    {
        level: 3,
        label: 'Advanced',
        labelKo: '고급',
        color: '#E53935',
        bgColor: 'rgba(229,57,53,0.1)',
        icon: '⚡',
        desc: 'Long & challenging verses',
        descKo: '길고 도전적인 구절 (81자 이상)',
    },
];

const LevelSelectionStep = ({ onSelect, onBack }) => {
    const handleSelect = (level) => {
        SFX.play('click');
        onSelect(level);
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <header style={{ marginBottom: '2vh' }}>
                <h1>Sugar logos</h1>
                <p className="subtitle">난이도를 선택해 주세요</p>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    Select your difficulty level
                </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {LEVELS.map(({ level, label, labelKo, color, bgColor, icon, desc, descKo }) => (
                    <div
                        key={level}
                        className="mission-card"
                        onClick={() => handleSelect(level)}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            padding: '28px 28px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            border: `2px solid ${color}40`,
                            background: bgColor,
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.4rem',
                            flexShrink: 0,
                            boxShadow: `0 4px 12px ${color}30`,
                        }}>
                            {icon}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: '800', color }}>Level {level}</span>
                                <span style={{
                                    background: color,
                                    color: 'white',
                                    borderRadius: '20px',
                                    padding: '3px 12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                }}>
                                    {label} · {labelKo}
                                </span>
                            </div>
                            <p style={{ color: '#444', fontSize: '1rem', margin: 0, fontWeight: '500' }}>{desc}</p>
                            <p style={{ color: '#888', fontSize: '0.85rem', margin: '4px 0 0 0' }}>{descKo}</p>
                        </div>
                        <ArrowRight size={28} color={color} />
                    </div>
                ))}
            </div>



            <style dangerouslySetInnerHTML={{ __html: `
                .mission-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
            `}} />
        </div>
    );
};

export default LevelSelectionStep;
