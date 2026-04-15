import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SFX } from '../utils/mission';
import { CheckCircle2, Award } from 'lucide-react';

const RewardStep = ({ user, userType, score, onFinish }) => {
    const [selectedRamen, setSelectedRamen] = useState(null);
    const [stampCount, setStampCount] = useState(0);
    const [isLoading, setIsLoading] = useState(userType === 'korean');

    useEffect(() => {
        if (userType === 'korean') {
            fetchStampCount();
        }
    }, [userType]);

    const fetchStampCount = async () => {
        try {
            const res = await fetch(`https://logos.app.koreanok.com/api/records/my-summary?user_type=korean`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sugar_token') || 'GUEST_TOKEN'}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Count rows with score >= 85 (or just count records if we assume only success reaches here)
                // Let's assume every success is a stamp. 
                // We'll count successful previous days/sessions.
                const count = data.length; 
                setStampCount(count % 10); // Loop every 10? Or just show up to 10.
            }
        } catch (e) {
            console.error('Failed to fetch stamps:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const ramens = [
        { id: 'shin', name: '신라면', img: 'https://www.theguru.co.kr/data/photos/20230939/art_16957821882918_0df19b.png' },
        { id: 'jin', name: '진라면', img: 'https://img.danawa.com/prod_img/500000/349/143/img/17143349_1.jpg?_v=20230717135936&shrink=360:360' },
        { id: 'buldak', name: '불닭볶음면', img: 'https://asset.m-gs.kr/prod/1038210326/1/550' },
        { id: 'neoguri', name: '너구리', img: 'https://img.danawa.com/prod_img/500000/282/798/img/32798282_1.jpg?_v=20251110184148&shrink=360:360' }
    ];

    const handleSelect = (ramen) => {
        SFX.play('click');
        setSelectedRamen(ramen);
    };

    const handleFinish = () => {
        if (userType === 'foreigner' && !selectedRamen) return alert('라면을 선택해 주세요!');
        
        if (userType === 'korean') {
            onFinish('STAMP');
        } else {
            onFinish(selectedRamen.name);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중...</div>;

    return (
        <div className="fade-in">
            <header>
                <h1>Mission Reward</h1>
                <p className="subtitle">{user}님, 성공을 축하합니다!</p>
            </header>

            <main>
                {userType === 'korean' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            background: 'white', padding: '30px', borderRadius: '30px', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px'
                        }}>
                            <h2 style={{ margin: '0 0 20px 0', color: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={28} style={{ marginRight: '10px' }} /> 스템프 북 (Stamp Book)
                            </h2>
                            <div style={{ 
                                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', 
                                maxWidth: '400px', margin: '0 auto' 
                            }}>
                                {[...Array(10)].map((_, i) => {
                                    const isStamped = i < stampCount;
                                    const isNew = i === stampCount - 1; // Assuming stampCount was updated after save
                                    return (
                                        <div key={i} style={{ 
                                            aspectRatio: '1', borderRadius: '50%', border: '3px dashed #eee',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isStamped ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                                            borderColor: isStamped ? '#FF6B6B' : '#eee',
                                            position: 'relative'
                                        }}>
                                            {isStamped && (
                                                <CheckCircle2 
                                                    color="#FF6B6B" 
                                                    size={32} 
                                                    className={isNew ? "animate-pop" : ""} 
                                                />
                                            )}
                                            <span style={{ 
                                                position: 'absolute', bottom: '-20px', fontSize: '0.8rem', 
                                                color: isStamped ? '#FF6B6B' : '#ccc', fontWeight: 700 
                                            }}>{i + 1}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <p style={{ color: '#666', marginBottom: '20px' }}>오늘 미션 성공으로 스템프가 찍혔습니다! 🎉</p>
                    </div>
                ) : (
                    <div className="ramen-grid">
                        {ramens.map(ramen => (
                            <div key={ramen.id} 
                                 className={`ramen-item ${selectedRamen?.id === ramen.id ? 'selected' : ''}`}
                                 onClick={() => handleSelect(ramen)}>
                                <img src={ramen.img} alt={ramen.name} />
                                <p style={{ fontWeight: 700 }}>{ramen.name}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '40px' }}>
                    <button className="btn-primary" onClick={handleFinish}>
                        {userType === 'korean' ? '스템프 찍기 (Stamp)' : '선택 완료 (Finish)'}
                    </button>
                </div>
            </main>

            <footer>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: '100%' }}></div>
                </div>
                <div className="step-indicator">
                    <span>{userType === 'korean' ? '스템프 적립' : '보상 선택'}</span>
                    <span>100%</span>
                </div>
            </footer>
        </div>
    );
};

export default RewardStep;
