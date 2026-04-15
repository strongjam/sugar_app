import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, LogOut, Award, Shield, Trash2, Star, User, Hash, Lock, Calendar, MessageSquare } from 'lucide-react';
import { SFX } from '../utils/mission';

const AdminStep = ({ token, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

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

    const filteredUsers = users
        .filter(u => {
            const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (u.student_id && u.student_id.includes(searchTerm));
            const matchesFilter = filter === 'all' || u.user_type === filter;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            const dateA = a.activity_date && a.activity_date !== '2000-01-01' ? new Date(a.activity_date) : new Date(0);
            const dateB = b.activity_date && b.activity_date !== '2000-01-01' ? new Date(b.activity_date) : new Date(0);
            return dateB - dateA; // Descending
        });

    const stats = {
        total: users.length,
        foreigner: users.filter(u => u.user_type === 'foreigner').length,
        korean: users.filter(u => u.user_type === 'korean').length,
        ramen: users.reduce((acc, current) => acc + (current.total_ramen || 0), 0)
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                {[
                    { label: '전체', value: stats.total, color: '#3498db', icon: <Users size={16} /> },
                    { label: '외국인', value: stats.foreigner, color: '#FF6B6B', icon: <Award size={16} /> },
                    { label: '한국인', value: stats.korean, color: '#4ECDC4', icon: <RefreshCw size={16} /> },
                    { label: '라면', value: stats.ramen, color: '#f1c40f', icon: <Award size={16} /> }
                ].map((s, i) => (
                    <div key={i} className="mission-card" style={{ padding: '15px', textAlign: 'center', margin: 0, background: 'rgba(255,255,255,0.8)' }}>
                        <div style={{ color: s.color, marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.label}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <main style={{ justifyContent: 'flex-start' }}>
                <div className="mission-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px' }}>
                            {['all', 'foreigner', 'korean'].map(f => (
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
                                    {f === 'all' ? '전체' : f === 'foreigner' ? '외국인' : '한국인'}
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
                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '20px', 
                                                    background: u.user_type === 'foreigner' ? '#FF6B6B' : '#4ECDC4',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {u.user_type === 'foreigner' ? 'FOREIGNER' : 'KOREAN'}
                                                </span>
                                            </div>
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
                                                {u.user_type === 'korean' ? <Star size={16} color="#FF6B6B" /> : <MessageSquare size={16} color="#4ECDC4" />}
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: '#888' }}>{u.user_type === 'korean' ? '스템프 합계' : '라면 미션'}</div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        {u.user_type === 'korean' ? `${u.total_stamps || 0}개` : `${u.total_ramen || 0}회`}
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
        </div>
    );
};

export default AdminStep;
