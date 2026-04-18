import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, LogOut, Award, Shield, Trash2, Star, User, Hash, Lock, Calendar, MessageSquare, BookOpen, X } from 'lucide-react';
import { SFX } from '../utils/mission';

const AdminStep = ({ token, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userVerses, setUserVerses] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('https://logos.app.koreanok.com/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('데이터를 불러오지 못했습니다.');
            }
        } catch (err) {
            setError('서버 통신 오류');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (username, user_type) => {
        if (!window.confirm(`${username} (${user_type}) 사용자의 모든 정보와 기록이 삭제됩니다. 계속하시겠습니까?`)) return;
        
        SFX.play('click');
        try {
            const res = await fetch(`https://logos.app.koreanok.com/api/admin/users/${username}?user_type=${user_type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                SFX.play('success');
                alert('삭제되었습니다.');
                fetchUsers();
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (err) {
            alert('서버 통신 오류');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUserVerses = async (username, user_type) => {
        setModalLoading(true);
        try {
            const res = await fetch(`https://logos.app.koreanok.com/api/admin/users/${username}/verses?user_type=${user_type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserVerses(data);
            }
        } catch (err) {
            console.error('Failed to fetch verses:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpenModal = (user) => {
        SFX.play('click');
        setSelectedUser(user);
        fetchUserVerses(user.username, user.user_type);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setUserVerses([]);
    };

    const filteredUsers = users
        .filter(u => {
            const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (u.student_id && u.student_id.includes(searchTerm));
            return matchesSearch;
        })
        .sort((a, b) => {
            if (filter === 'ranking') {
                const countA = (a.total_stamps || 0) + (a.total_ramen || 0);
                const countB = (b.total_stamps || 0) + (b.total_ramen || 0);
                if (countB !== countA) return countB - countA;
            } else if (filter === 'highscore') {
                const scoreA = a.high_score || 0;
                const scoreB = b.high_score || 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
            }
            
            // Default: activity_date descending
            const dateA = a.activity_date && a.activity_date !== '2000-01-01' ? new Date(a.activity_date) : new Date(0);
            const dateB = b.activity_date && b.activity_date !== '2000-01-01' ? new Date(b.activity_date) : new Date(0);
            return dateB - dateA;
        });

    const stats = {
        total: users.length,
        total_stamps: users.reduce((acc, u) => acc + (u.total_stamps || 0) + (u.total_ramen || 0), 0)
    };

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '30px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                    <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900 }}>
                        <Shield size={28} color="#FF6B6B" /> Analytics
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="num-btn" style={{ width: '40px', height: '40px', borderRadius: '10px' }} onClick={fetchUsers}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="num-btn special" style={{ width: 'auto', height: '40px', padding: '0 15px', borderRadius: '10px', whiteSpace: 'nowrap', fontSize: '0.9rem' }} onClick={onLogout}>
                        <LogOut size={16} style={{ marginRight: '6px' }} /> 로그아웃
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                {[
                    { label: '전체 사용자', value: stats.total, color: '#3498db', icon: <Users size={20} /> },
                    { label: '스탬프 총 개수', value: stats.total_stamps, color: '#f1c40f', icon: <Award size={20} /> }
                ].map((s, i) => (
                    <div key={i} className="mission-card" style={{ padding: '20px', textAlign: 'center', margin: 0, background: 'rgba(255,255,255,0.8)' }}>
                        <div style={{ color: s.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{s.value}{i === 0 ? '명' : '개'}</div>
                    </div>
                ))}
            </div>

            <main style={{ justifyContent: 'flex-start' }}>
                <div className="mission-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px' }}>
                            {['all', 'ranking', 'highscore'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: 'none', 
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        background: filter === f ? '#fff' : 'transparent',
                                        color: filter === f ? '#333' : '#777',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {f === 'all' ? '전체' : f === 'ranking' ? '스탬프 랭킹' : '최고점수'}
                                </button>
                            ))}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input 
                                type="text"
                                placeholder="조회..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-display"
                                style={{ height: '35px', fontSize: '0.85rem', paddingLeft: '35px', textAlign: 'left', letterSpacing: 'normal', borderRadius: '10px' }}
                            />
                        </div>
                    </div>

                    <div style={{ 
                        height: '450px', 
                        overflowY: 'auto', 
                        overflowX: 'hidden', 
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderRadius: '0 0 15px 15px',
                        background: 'rgba(255,255,255,0.1)'
                    }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>로딩 중...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>데이터가 없습니다.</div>
                        ) : (
                            filteredUsers.map((u, i) => {
                                const isHighScore = (u.high_score || 0) >= 90;
                                return (
                                    <div key={i} style={{ 
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: isHighScore ? 'rgba(255, 215, 0, 0.05)' : 'white',
                                        border: isHighScore ? '2px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                        position: 'relative',
                                        transition: 'transform 0.2s'
                                    }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ 
                                                    width: '32px', 
                                                    height: '32px', 
                                                    borderRadius: '10px', 
                                                    background: isHighScore ? '#FFD700' : '#f0f0f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: isHighScore ? 'white' : '#666'
                                                }}>
                                                    {isHighScore ? <Star size={16} fill="white" /> : <User size={16} />}
                                                </div>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{u.username}</span>
                                                {u.user_type === 'korean' && (
                                                    <span style={{ 
                                                        fontSize: '0.65rem', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '20px', 
                                                        background: '#4ECDC4',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        letterSpacing: '1px'
                                                    }}>
                                                        한국인
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleOpenModal(u)}
                                                    style={{ 
                                                        background: 'rgba(78,205,196,0.1)',
                                                        color: '#4ECDC4',
                                                        border: 'none',
                                                        padding: '0 10px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    <BookOpen size={14} /> 상세 내역
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(u.username, u.user_type)}
                                                    style={{ 
                                                        background: 'rgba(255,107,107,0.1)',
                                                        color: '#FF6B6B',
                                                        border: 'none',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Award size={16} color="#FF6B6B" />
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: '#888' }}>최고 점수</div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isHighScore ? '#FF8C00' : '#444' }}>{u.high_score || 0}점</div>
                                                </div>
                                            </div>
                                            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Star size={16} color="#f1c40f" />
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: '#888' }}>스탬프 개수</div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        {(u.total_stamps || 0) + (u.total_ramen || 0)}개
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metadata Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#888', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Hash size={12} /> {u.student_id || '-'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Lock size={12} /> {u.password}
                                                </span>
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {u.activity_date && u.activity_date !== '2000-01-01' ? u.activity_date.split(' ')[0] : '기록 없음'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <footer style={{ paddingTop: '10px' }}>
                <div className="step-indicator" style={{ justifyContent: 'center', fontSize: '0.8rem' }}>
                    <span>총 {filteredUsers.length}명 등록됨</span>
                </div>
            </footer>
            {selectedUser && (
                <VerseModal 
                    user={selectedUser} 
                    verses={userVerses} 
                    loading={modalLoading} 
                    onClose={handleCloseModal} 
                />
            )}
        </div>
    );
};

const VerseModal = ({ user, verses, loading, onClose }) => {
    const levels = [
        { id: 1, title: '🌱 Level 1 (초급)', color: '#4CAF50' },
        { id: 2, title: '🔥 Level 2 (중급)', color: '#FF9800' },
        { id: 3, title: '⚡ Level 3 (고급)', color: '#E53935' }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }} onClick={onClose}>
            <div 
                style={{
                    background: 'white', width: '100%', maxWidth: '600px',
                    borderRadius: '24px', position: 'relative',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <header style={{ padding: '25px', borderBottom: '1px solid #eee', position: 'relative' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '5px' }}>
                        <span style={{ color: '#4ECDC4' }}>{user.username}</span>님의 성공 기록
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>이전 활동에서 성공했던 말씀 구절 목록입니다.</p>
                    <button onClick={onClose} style={{
                        position: 'absolute', right: '20px', top: '25px',
                        background: '#f5f5f5', border: 'none', borderRadius: '50%',
                        width: '36px', height: '36px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <X size={20} color="#666" />
                    </button>
                </header>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>상세 내역을 불러오는 중...</div>
                    ) : verses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>아직 성공 기록이 없습니다.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {levels.map(lvl => {
                                const levelVerses = verses.filter(v => (v.level || (user.user_type === 'korean' ? 0 : 1)) === lvl.id);
                                if (levelVerses.length === 0 && user.user_type === 'foreigner') return null;
                                if (lvl.id === 1 && user.user_type === 'korean' && levelVerses.length === 0) {
                                    // Handle legacy data or Korean users differently if needed
                                    const legacyVerses = verses.filter(v => v.level === null);
                                    if (legacyVerses.length === 0) return null;
                                }

                                return (
                                    <section key={lvl.id}>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '8px', 
                                            marginBottom: '12px', paddingBottom: '8px', 
                                            borderBottom: `2px solid ${lvl.color}30` 
                                        }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: lvl.color }}>{lvl.title}</span>
                                            <span style={{ 
                                                fontSize: '0.75rem', background: '#f0f0f0', 
                                                padding: '2px 8px', borderRadius: '10px', color: '#666' 
                                            }}>
                                                {lvl.id === 1 && user.user_type === 'korean' ? verses.length : levelVerses.length}회 성공
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(lvl.id === 1 && user.user_type === 'korean' ? verses : levelVerses).map((v, idx) => (
                                                <div key={idx} style={{ 
                                                    padding: '12px', background: '#f8f9fa', 
                                                    borderRadius: '12px', border: '1px solid #eee' 
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#333' }}>{v.verse_ref || '구절 정보 없음 (이전 데이터)'}</span>
                                                        <span style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '0.9rem' }}>{v.score}점</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', gap: '8px' }}>
                                                        <Calendar size={12} /> {v.created_at.split(' ')[0]}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                <footer style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                    <button onClick={onClose} className="num-btn special" style={{ width: '100%', height: '50px' }}>확인</button>
                </footer>
            </div>
        </div>
    );
};

export default AdminStep;
