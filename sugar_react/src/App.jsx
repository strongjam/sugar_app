import React, { useState, useEffect, useRef } from 'react';
import AuthStep from './components/AuthStep';
import AdminStep from './components/AdminStep';
import EntryStep from './components/EntryStep';
import RecitalStep from './components/RecitalStep';
import RewardStep from './components/RewardStep';
import PraiseStep from './components/PraiseStep';
import LevelSelectionStep from './components/LevelSelectionStep';

function App() {
  // Step: -4: LevelSelection, -2: Admin, -1: Auth, 1: Recital, 2: Reward, 3: Praise
  const [step, setStep] = useState(localStorage.getItem('sugar_token') ? (localStorage.getItem('sugar_is_admin') === 'true' ? -2 : 1) : -4);
  
  const [user, setUser] = useState(localStorage.getItem('sugar_user_name') || '');
  const [token, setToken] = useState(localStorage.getItem('sugar_token') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('sugar_is_admin') === 'true');
  // userType is always 'foreigner'
  const [userType] = useState('foreigner');
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(0);
  const [pendingRamen, setPendingRamen] = useState(null);
  const [finalRewardMessage, setFinalRewardMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const isSubmitting = useRef(false);

  const handleLevelSelect = (level) => {
    setUserLevel(level);
    setStep(1);
  };

  useEffect(() => {
    // If the page is reloaded and it's not an admin session, start fresh
    if (localStorage.getItem('sugar_token') && localStorage.getItem('sugar_is_admin') !== 'true') {
        handleLogout();
    }
  }, []);

  const computeUserLevel = (records) => {
    const successDays = records.filter(r => r.high_score >= 85).length;
    if (successDays >= 7) return 3;
    if (successDays >= 3) return 2;
    return 1;
  };

  const checkAlreadySucceeded = async (activeToken, activeUserType) => {
    try {
        const res = await fetch(`https://logos.koreanok.com/api/records/my-summary?user_type=${activeUserType}`, {
            headers: { 
                'Authorization': `Bearer ${activeToken}`,
                'Cache-Control': 'no-cache'
            }
        });
        if (res.ok) {
            const data = await res.json();
            // Compute level for foreigner users
            if (activeUserType === 'foreigner') {
                setUserLevel(computeUserLevel(data));
            }
            const now = new Date();
            const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            return data.some(row => row.date === today && row.high_score >= 85);
        }
    } catch (e) {
        console.error('Failed to check participation:', e);
    }
    return false;
  };

  const handleAuthSuccess = async (data) => {
    setUser(data.username);
    setToken(data.token);
    setIsAdmin(data.isAdmin === 1);
    localStorage.setItem('sugar_user_name', data.username);
    localStorage.setItem('sugar_token', data.token);
    localStorage.setItem('sugar_is_admin', data.isAdmin === 1 ? 'true' : 'false');
    
    if (data.isAdmin === 1) setStep(-2);
    else {
      setStudentId(data.username);
      
      // Check if they already succeeded today
      const alreadySucceeded = await checkAlreadySucceeded(data.token, userType);
      
      if (pendingRamen) {
          if (alreadySucceeded) {
              const msg = userType === 'korean' 
                ? "이미 오늘 포인트를 받아가셨습니다. 내일 다시 도전해 주세요!" 
                : `${data.username}님, 오늘은 이미 보상을 수령하셨습니다. (내일 다시 도전해 주세요)`;
              setFinalRewardMessage(msg);
              handleFinish('NONE', score, data.token, data.username, msg);
          } else if (pendingRamen === 'STAMP') {
              handleFinish(pendingRamen, score, data.token, data.username);
          } else {
              const msg = `${data.username}님, '${pendingRamen}' 맛있게 드세요!🎉`;
              setFinalRewardMessage(msg);
              handleFinish(pendingRamen, score, data.token, data.username, msg);
          }
      } else {
        setStep(1); 
      }
    }
  };

  const handleRecitalNext = async (finalScore) => {
    setScore(finalScore);
    if (finalScore >= 85) {
        if (token) {
            const alreadySucceeded = await checkAlreadySucceeded(token, userType);
            if (alreadySucceeded) {
                const msg = `${user || studentId}님, 오늘은 이미 보상을 수령하셨습니다. (내일 다시 도전해 주세요)`;
                setFinalRewardMessage(msg);
                handleFinish('NONE', finalScore, token, user || studentId, msg);
                return;
            }
        }
        setStep(2);
    } else {
        setStep(3); 
    }
  };

  const handleRewardFinish = (ramen) => {
    if (token) {
        // If already logged in, handle final save and move to Praise
        handleFinish(ramen, score);
    } else {
        // Late login flow
        setPendingRamen(ramen);
        setStep(-1); 
    }
  };

  const handleFinish = async (ramen, finalScore, overrideToken, overrideUser, overrideMsg, shouldRedirect = true) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsSaving(true);

    const activeScore = finalScore || score;
    const activeToken = overrideToken || token;
    const activeUser = overrideUser || user || studentId;
    let activeRamen = ramen || 'NONE';
    
    if (!overrideMsg && !finalRewardMessage) {
        if (activeRamen !== 'NONE' && activeRamen !== 'STAMP') {
            setFinalRewardMessage(`${activeUser}님, ${activeRamen} 맛있게 드세요!🎉`);
        }
    }

    try {
      await fetch('https://logos.koreanok.com/api/records', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken || 'GUEST_TOKEN'}`
        },
        body: JSON.stringify({ 
          score: activeScore, 
          ramen_type: activeRamen, 
          student_id: activeUser || (userType === 'korean' ? 'KOREAN_GUEST' : 'GUEST'),
          user_type: userType 
        })
      });
    } catch (e) {
      console.error('Failed to save record:', e);
    } finally {
      setIsSaving(false);
      if (shouldRedirect) setStep(3);
    }
  };

  const handleRestart = () => {
    isSubmitting.current = false; 
    localStorage.clear();
    setStep(-4);
    setUser('');
    setToken('');
    setStudentId('');
    setIsAdmin(false);
    setScore(0);
    setPendingRamen(null);
    setFinalRewardMessage('');
  };

  const handleLogout = () => {
    localStorage.clear();
    setStep(-4);
    setUser('');
    setToken('');
    setStudentId('');
    setIsAdmin(false);
  };

  return (
    <div className="kiosk-container">
      {step === -4 && <LevelSelectionStep onSelect={handleLevelSelect} onBack={null} />}
      {step === -2 && <AdminStep token={token} onLogout={handleLogout} />}
      {step === -1 && (
        <AuthStep 
            userType={userType} 
            pendingRamen={pendingRamen}
            onAuthSuccess={handleAuthSuccess} 
            onBack={() => setStep(-4)} 
        />
      )}
      {step === 1 && <RecitalStep userType={userType} token={token} userLevel={userLevel} onNext={handleRecitalNext} onBack={() => { handleRestart(); }} />}
      
      {step === 2 && (
        <RewardStep 
          user={user || studentId} 
          userType={userType}
          score={score} 
          onFinish={handleRewardFinish} 
        />
      )}

      {step === 3 && (
        <PraiseStep 
            user={user || studentId} 
            userType={userType} 
            score={score} 
            token={token}
            finalRewardMessage={finalRewardMessage} 
            onRestart={handleRestart} 
        />
      )}

      {isSaving && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>저장 중...</h2>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #eee', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
      )}
    </div>
  );
}

export default App;
