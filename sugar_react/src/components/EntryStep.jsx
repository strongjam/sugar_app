import React from 'react';
import { SFX } from '../utils/mission';

const EntryStep = ({ onNext, initialValue = '', onLogout }) => {
    const [userId, setUserId] = React.useState(initialValue);

    const handleNumClick = (val) => {
        SFX.play('click');
        if (val === 'CLR') setUserId('');
        else if (val === 'DEL') setUserId(prev => prev.slice(0, -1));
        else if (userId.length < 11) setUserId(prev => prev + val);
    };

    const handleStart = () => {
        if (!userId) return alert('학번 또는 전화번호를 입력해주세요.');
        SFX.play('success');
        onNext(userId);
    };

    return (
        <div className="fade-in">
            <header>
                <h1>Sugar Logos</h1>
                <p className="subtitle">성경암송 한구절, 사랑 한 그릇</p>
                {onLogout && (
                    <button className="num-btn special" 
                            style={{ position: 'absolute', top: '20px', right: '20px', width: 'auto', padding: '0 15px', height: '35px', fontSize: '0.8rem' }}
                            onClick={onLogout}>
                        로그아웃 (Logout)
                    </button>
                )}
            </header>

            <main>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontWeight: 600, color: '#1e272e' }}>학번 또는 전화번호를 입력하세요</h2>
                </div>
                
                <div className="input-display-container">
                    <div className="input-display">{userId}</div>
                </div>

                <div className="numpad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} className="num-btn" onClick={() => handleNumClick(num.toString())}>{num}</button>
                    ))}
                    <button className="num-btn special" onClick={() => handleNumClick('CLR')}>CLR</button>
                    <button className="num-btn" onClick={() => handleNumClick('0')}>0</button>
                    <button className="num-btn special" onClick={() => handleNumClick('DEL')}>DEL</button>
                </div>
                
                <div style={{ marginTop: '40px' }}>
                    <button className="btn-primary" onClick={handleStart}>시작하기 (Start)</button>
                </div>
            </main>

            <footer>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: '33%' }}></div>
                </div>
                <div className="step-indicator">
                    <span>학번 확인</span>
                    <span>33%</span>
                </div>
            </footer>
        </div>
    );
};

export default EntryStep;
