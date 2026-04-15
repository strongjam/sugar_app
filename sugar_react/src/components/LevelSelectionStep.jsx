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
            <header style={{ marginBottom: '3vh' }}>
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
                            gap: '20px',
                            padding: '20px 24px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            border: `2px solid ${color}20`,
                        }}
                    >
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            flexShrink: 0,
                        }}>
                            {icon}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color }}>Level {level}</span>
                                <span style={{
                                    background: color,
                                    color: 'white',
                                    borderRadius: '20px',
                                    padding: '2px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                }}>
                                    {label} · {labelKo}
                                </span>
                            </div>
                            <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
                            <p style={{ color: '#aaa', fontSize: '0.78rem', margin: '2px 0 0 0' }}>{descKo}</p>
                        </div>
                        <ArrowRight size={20} color={color} />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'left' }}>
                <button
                    className="num-btn special"
                    style={{ width: '180px', height: '50px' }}
                    onClick={onBack}
                >
                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> 이전으로 (Back)
                </button>
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
