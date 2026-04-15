import React, { useState, useEffect } from 'react';
import { CheckCircle2, Award, Heart, Smile, Star, Crown, Sparkles, History, X, Calendar } from 'lucide-react';
import { BIBLE_VERSES } from '../data/verses';
import { SFX } from '../utils/mission';

const PraiseStep = ({ user, userType, score, token, finalRewardMessage, onRestart }) => {
    const [stampCount, setStampCount] = useState(0);
    const [isLoading, setIsLoading] = useState(userType === 'korean' && score >= 85);
    const [showArchive, setShowArchive] = useState(false);
    const [pastScores, setPastScores] = useState({});

    useEffect(() => {
        if (userType === 'korean' && score >= 85) {
            fetchStampCount();
        }
    }, [userType, score]);

    const fetchStampCount = async () => {
        try {
            const res = await fetch(`https://logos.koreanok.com/api/records/my-summary?user_type=korean`, {
                headers: { 
                    'Authorization': `Bearer ${token || 'GUEST_TOKEN'}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStampCount(data.length % 10 || 0);
            }
        } catch (e) {
            console.error('Failed to fetch stamps:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const formatReference = (ref) => {
        if (!ref) return "";
        return ref.replace(':', '장 ') + '절';
    };

    const getPastVerses = () => {
        const today = new Date().setHours(0,0,0,0);
        const dayMs = 86400000;
        const past = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today - (i * dayMs));
            const isoDate = date.toISOString().split('T')[0];
            const idx = Math.floor((date.getTime() - new Date(2024,0,1).getTime()) / dayMs) % BIBLE_VERSES.length;
            past.push({ date: date.toLocaleDateString(), isoDate, ...BIBLE_VERSES[idx], formattedRef: formatReference(BIBLE_VERSES[idx].ref) });
        }
        return past;
    };

    const fetchPastScores = async () => {
        try {
            const res = await fetch(`https://logos.koreanok.com/api/records/my-summary?user_type=${userType}`, {
                headers: { 
                    'Authorization': `Bearer ${token || 'GUEST_TOKEN'}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (res.ok) {
                const data = await res.json();
                const scoreMap = {};
                data.forEach(row => {
                    scoreMap[row.date] = row.high_score;
                });
                setPastScores(scoreMap);
            }
        } catch (e) {
            console.error('Failed to fetch past scores:', e);
        }
    };

    const handleToggleArchive = () => {
        const nextShow = !showArchive;
        setShowArchive(nextShow);
        if (nextShow) {
            SFX.play('click');
            fetchPastScores();
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중...</div>;

    return (
        <div className="fade-in" style={{ textAlign: 'center', padding: '10px 10px 80px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{ marginBottom: '2vh' }}>
                <h1 style={{ fontSize: 'clamp(2rem, 8vh, 3rem)' }}>🎉 참 잘하셨습니다!</h1>
                <p className="subtitle" style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {finalRewardMessage || (userType === 'korean' ? '오늘 하루도 말씀으로 승리하세요!' : '수고하셨습니다!')}
                </p>
            </header>

            <main style={{ maxWidth: '600px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="mission-card" style={{ padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                    {userType === 'korean' ? (
                        score >= 85 ? (
                            <div style={{ width: '100%' }}>
                                <h2 style={{ margin: '0 0 20px 0', color: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={28} style={{ marginRight: '10px' }} /> 스탬프 현황 (Stamps)
                                </h2>
                                <div style={{ 
                                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', 
                                    maxWidth: '400px', margin: '0 auto 20px auto' 
                                }}>
                                    {[...Array(10)].map((_, i) => {
                                        const displayCount = stampCount || (score >= 85 ? 1 : 0);
                                        const isMarked = i < displayCount;
                                        
                                        return (
                                            <div key={i} style={{ 
                                                aspectRatio: '1', borderRadius: '50%', border: '3px dashed #eee',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isMarked ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                                                borderColor: isMarked ? '#FF6B6B' : '#eee',
                                                position: 'relative'
                                            }}>
                                                {isMarked && (
                                                    <CheckCircle2 color="#FF6B6B" size={32} className="animate-pop" />
                                                )}
                                                <span style={{ 
                                                    position: 'absolute', bottom: '-20px', fontSize: '0.8rem', 
                                                    color: isMarked ? '#FF6B6B' : '#ccc', fontWeight: 700 
                                                }}>{i + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '20px' }}>
                                    <Crown color="#FFB800" size={100} />
                                </div>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#FFB800' }}>오늘도 말씀으로 승리!</h2>
                                <p style={{ color: '#666', marginBottom: '20px' }}>말씀과 함께하는 복된 하루 되세요. ✨</p>
                            </div>
                        )
                    ) : (
                        score >= 85 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '15px' }}>
                                    <CheckCircle2 color="var(--primary)" size={80} />
                                </div>
                                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem' }}>미션 완료!</h2>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '15px' }}>
                                    <Heart color="#FF6B6B" size={80} fill="#FF6B6B" style={{ opacity: 0.8 }} />
                                </div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>수고하셨습니다!</h2>
                                <p style={{ color: '#888', marginBottom: '15px' }}>다음에 또 도전해 보세요! 💪</p>
                            </div>
                        )
                    )}
                    
                    {score >= 85 && (
                        <>
                            <div className="score-badge" style={{ fontSize: '2.5rem', padding: '10px 25px', margin: '20px auto', width: 'fit-content' }}>
                                {score}점
                            </div>
                            <p style={{ color: '#666', margin: 0 }}>말씀을 암송하는 당신의 모습이 참 아름답습니다.</p>
                        </>
                    )}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {score >= 85 && token && (
                        <button className="num-btn special" 
                                style={{ height: '55px', borderRadius: '15px', fontSize: '1.1rem' }} 
                                onClick={handleToggleArchive}>
                            <History size={20} style={{ marginRight: '10px' }} /> 지난 말씀 모두 보기 (View Past Verses)
                        </button>
                    )}
                    <button className="btn-primary" style={{ height: '60px', borderRadius: '15px', fontSize: '1.2rem' }} onClick={onRestart}>
                        메인화면으로 돌아가기 (Home)
                    </button>
                </div>
            </main>

            {showArchive && (
                <div className="fade-in" style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="mission-card" style={{ 
                        width: '90%', maxWidth: '600px', maxHeight: '80vh', 
                        overflowY: 'auto', textAlign: 'left', padding: '30px' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#333', fontSize: '1.4rem', display: 'flex', alignItems: 'center', fontWeight: '800' }}>
                                <Calendar size={24} style={{ marginRight: '12px', color: '#FF6B6B' }} /> 지난 말씀 (Past Verses)
                            </h3>
                            <button 
                                className="num-btn" 
                                style={{ 
                                    width: '45px', height: '45px', borderRadius: '50%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 0, border: 'none', background: 'rgba(0,0,0,0.05)',
                                    transition: 'background 0.2s'
                                }} 
                                onClick={() => setShowArchive(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {getPastVerses().map((v, i) => (
                                <div key={i} style={{ 
                                    padding: '24px', 
                                    background: 'rgba(255,255,255,0.6)', 
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{ fontSize: '0.9rem', color: '#FF6B6B', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{v.date}</span>
                                        {pastScores[v.isoDate] !== undefined ? (
                                            <span style={{ 
                                                background: pastScores[v.isoDate] >= 85 ? '#FF6B6B' : '#636e72', 
                                                color: 'white', padding: '4px 10px', 
                                                borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800'
                                            }}>
                                                {pastScores[v.isoDate] >= 85 ? '성공' : '도전'}: {pastScores[v.isoDate]}점
                                            </span>
                                        ) : (
                                            <span style={{ 
                                                background: '#f1f2f6', color: '#b2bec3', padding: '4px 10px', 
                                                borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600'
                                            }}>
                                                미참여
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '10px', color: '#2d3436' }}>{v.formattedRef}</div>
                                    <div style={{ fontSize: '1.05rem', color: '#636e72', lineHeight: '1.6', fontStyle: 'italic' }}>"{v.text}"</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PraiseStep;
