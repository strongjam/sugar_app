import React from 'react';
import { Globe, User, Award, ArrowRight } from 'lucide-react';
import { SFX } from '../utils/mission';

const SelectionStep = ({ onSelect }) => {
    const handleSelect = (type) => {
        SFX.play('click');
        onSelect(type);
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <header style={{ marginBottom: '5vh' }}>
                <h1>Sugar logos</h1>
                <p className="subtitle">사용자 유형을 선택해 주세요 (Select your type)</p>
            </header>

            <div className="selection-grid">
                <div className="mission-card" 
                     onClick={() => handleSelect('foreigner')}
                     style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease', height: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Globe size={40} color="#FF6B6B" />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>일반 사람</h2>
                        <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', lineHeight: '1.4' }}>
                            미션 수행 및 보상 받기<br/>
                            <span style={{ fontSize: '0.75rem' }}>Login Required for Rewards</span>
                        </p>
                    </div>
                    <button className="num-btn special" style={{ width: '100%', marginTop: '20px', height: '50px', fontSize: '1rem' }}>
                        시작하기 <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </button>
                </div>

                <div className="mission-card" 
                     onClick={() => handleSelect('korean')}
                     style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease', height: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(78,205,196,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <User size={40} color="#4ECDC4" />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>한국인</h2>
                        <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', lineHeight: '1.4' }}>
                            오늘의 말씀 암송하기<br/>
                            <span style={{ fontSize: '0.75rem' }}>Enjoy Recital without Rewards</span>
                        </p>
                    </div>
                    <button className="num-btn special" style={{ width: '100%', marginTop: '20px', height: '50px', fontSize: '1rem' }}>
                        시작하기 <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </button>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .mission-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                }
            `}} />
        </div>
    );
};

export default SelectionStep;
