import React, { useState } from 'react';
import { User, Lock, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { SFX } from '../utils/mission';

const AuthStep = ({ onAuthSuccess, onBack, userType, pendingRamen }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_BASE = 'https://logos.koreanok.com/api'; // Use absolute URL for production

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return alert('아이디와 비밀번호를 입력해주세요.');
        if (!isLogin && password !== confirmPassword) {
            setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
            return;
        }
        
        setLoading(true);
        setMessage({ type: '', text: '' });
        SFX.play('click');

        const endpoint = isLogin ? '/auth/login' : '/auth/signup';
        
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, user_type: userType })
            });
            const data = await res.json();

            if (res.ok) {
                SFX.play('success');
                if (isLogin) {
                    onAuthSuccess(data); // data contains token and username
                } else {
                    setMessage({ type: 'success', text: '회원가입이 완료되었습니다. 로그인해주세요!' });
                    setIsLogin(true);
                    setPassword('');
                }
            } else {
                setMessage({ type: 'error', text: data.error || '오류가 발생했습니다.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '서버와 통신할 수 없습니다.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <header>
                <h1>Sugar Logos</h1>
                <p className="subtitle">성경암송 미션 시작하기</p>
            </header>

            <main>
                <div className="mission-card" style={{ padding: '3vh 30px' }}>
                    {pendingRamen && (
                        <div className="fade-in animate-bounce-subtle" style={{ 
                            background: userType === 'korean' ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                            border: `2px solid ${userType === 'korean' ? '#4ecdc4' : '#ff6b6b'}`,
                            borderRadius: '20px',
                            padding: '20px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '1.4rem', 
                                color: userType === 'korean' ? '#45b7af' : '#e65a5a',
                                fontWeight: 'bold' 
                            }}>
                                {userType === 'korean' 
                                    ? '🎁 로그인 을 하셔야 포인트가 적립됩니다!' 
                                    : `🍜 로그인을 하시면 선택하신 '${pendingRamen}'을 받아가실 수 있습니다!`}
                            </h2>
                        </div>
                    )}
                    <div style={{ display: 'flex', marginBottom: '25px', gap: '10px' }}>
                        <button 
                            className={`num-btn ${isLogin ? 'active' : 'special'}`} 
                            style={{ flex: 1, height: '50px', background: isLogin ? 'var(--primary-gradient)' : '', color: isLogin ? 'white' : '' }}
                            onClick={() => { setIsLogin(true); setMessage({ type: '', text: '' }); SFX.play('click'); }}
                        >
                            로그인
                        </button>
                        <button 
                            className={`num-btn ${!isLogin ? 'active' : 'special'}`} 
                            style={{ flex: 1, height: '50px', background: !isLogin ? 'var(--primary-gradient)' : '', color: !isLogin ? 'white' : '' }}
                            onClick={() => { setIsLogin(false); setConfirmPassword(''); setMessage({ type: '', text: '' }); SFX.play('click'); }}
                        >
                            회원가입
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="input-display-container" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="text" 
                                    placeholder="아이디 (ID / Student No.)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-display"
                                    style={{ fontSize: '1.2rem', paddingLeft: '45px', textAlign: 'left', letterSpacing: 'normal' }}
                                />
                            </div>
                        </div>

                        <div className="input-display-container" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="password" 
                                    placeholder="비밀번호 (Password)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-display"
                                    style={{ fontSize: '1.2rem', paddingLeft: '45px', textAlign: 'left', letterSpacing: 'normal' }}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="input-display-container" style={{ margin: 0 }}>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <input 
                                        type="password" 
                                        placeholder="비밀번호 확인 (Confirm Password)"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-display"
                                        style={{ fontSize: '1.2rem', paddingLeft: '45px', textAlign: 'left', letterSpacing: 'normal' }}
                                    />
                                </div>
                            </div>
                        )}

                        {message.text && (
                            <p style={{ color: message.type === 'error' ? '#ff4d4f' : '#52c41a', fontSize: '0.9rem', textAlign: 'center' }}>
                                {message.text}
                            </p>
                        )}

                        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? '처리 중...' : (isLogin ? '로그인 (Login)' : '회원가입 (Join)')}
                            {isLogin ? <LogIn size={20} style={{ marginLeft: '8px' }} /> : <UserPlus size={20} style={{ marginLeft: '8px' }} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'left' }}>
                        <button className="num-btn special" 
                                style={{ width: '150px', height: '45px', fontSize: '0.9rem' }} 
                                onClick={onBack}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> 이전으로 (Back)
                        </button>
                    </div>
                </div>
            </main>

            <footer>
                <div className="step-indicator" style={{ justifyContent: 'center' }}>
                    <span>{pendingRamen ? '보상을 받으려면 로그인해 주세요!' : '환영합니다! 먼저 로그인해 주세요.'}</span>
                </div>
            </footer>
        </div>
    );
};

export default AuthStep;
