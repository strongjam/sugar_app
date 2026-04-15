import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Mic, Square, Volume2, ArrowLeft, X } from 'lucide-react';
import { SFX, speak, getSimilarityScore } from '../utils/mission';
import { BIBLE_VERSES } from '../data/verses';

const RecitalStep = ({ onNext, onBack, userType, token, userLevel = 1 }) => {
    const [isReciting, setIsReciting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [score, setScore] = useState(null);
    const [isWaveActive, setIsWaveActive] = useState(false);
    const recognitionRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');
    const isRecitingRef = useRef(false);

    const formatReference = (ref) => {
        if (!ref) return "";
        // 시편(Psalms)은 '장' 대신 '편'을 사용
        const isPsalm = ref.startsWith('시편');
        return ref.replace(':', isPsalm ? '편 ' : '장 ') + '절';
    };

    // Level-based verse selection for foreigner users
    const getVersePool = () => {
        if (userType !== 'foreigner') return BIBLE_VERSES;
        const level1 = BIBLE_VERSES.filter(v => v.text.length <= 40);
        const level2 = BIBLE_VERSES.filter(v => v.text.length > 40 && v.text.length <= 80);
        const level3 = BIBLE_VERSES.filter(v => v.text.length > 80);
        if (userLevel >= 3) return level3.length > 0 ? level3 : BIBLE_VERSES;
        if (userLevel >= 2) return level2.length > 0 ? level2 : BIBLE_VERSES;
        return level1.length > 0 ? level1 : BIBLE_VERSES;
    };

    const versePool = getVersePool();
    const dayIndex = Math.floor((new Date().setHours(0,0,0,0) - new Date(2024,0,1).getTime()) / 86400000);
    const dailyVerse = versePool[dayIndex % versePool.length];
    
    const formattedRef = formatReference(dailyVerse.ref);
    // Merge Ref and Text for combined recital
    const fullTargetText = `${formattedRef} ${dailyVerse.text}`.replace(/"/g, "").trim();
    const displayRef = formattedRef;
    const displayText = dailyVerse.text;

    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true; 

            recognitionRef.current.onresult = (event) => {
                let fullText = '';
                for (let i = 0; i < event.results.length; i++) {
                    fullText += event.results[i][0].transcript;
                }
                accumulatedTranscriptRef.current = fullText;
            };

            recognitionRef.current.onend = () => {
                if (isRecitingRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log('Recognition restart ignored:', e);
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech Recognition Error:', event.error);
            };
        }
    }, []);

    const handleToggleRecital = () => {
        SFX.play('click');
        if (!isReciting) {
            setTranscript('');
            accumulatedTranscriptRef.current = '';
            setScore(null);
            setIsReciting(true);
            isRecitingRef.current = true;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) { console.error(e); }
            }
        } else {
            setIsReciting(false);
            isRecitingRef.current = false;
            setTranscript("🎤 분석 중입니다...");
            
            if (recognitionRef.current) {
                // Use a one-time handler for this specific finalization
                const handleFinalize = () => {
                    SFX.play('success');
                    const finalResults = accumulatedTranscriptRef.current.trim();
                    setTranscript(finalResults);
                    
                    if (finalResults) {
                        const finalScore = getSimilarityScore(fullTargetText, finalResults);
                        setScore(finalScore);
                        if (finalScore >= 85) SFX.play('success');
                    } else {
                        setScore(0);
                    }
                    // Reset onend to the normal restart logic for next session
                    recognitionRef.current.onend = () => {
                        if (isRecitingRef.current) {
                            try { recognitionRef.current.start(); } catch(e){}
                        }
                    };
                };
                
                recognitionRef.current.ononend = handleFinalize; // Safety for some browsers
                recognitionRef.current.onend = handleFinalize;
                recognitionRef.current.stop();
            }
        }
    };



    return (
        <div className="fade-in">
            <header>
                <h1>Sugar logos</h1>
                <p className="subtitle" style={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                    💡 말씀 구절을 처음에 말하시고 이어서 말씀을 암송해주세요.
                </p>
                {userType === 'foreigner' && (
                    <div style={{ display: 'inline-block', background: userLevel === 1 ? '#4CAF50' : userLevel === 2 ? '#FF9800' : '#E53935', color: 'white', borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '6px', marginBottom: '2px' }}>
                        Level {userLevel} · {userLevel === 1 ? 'Beginner' : userLevel === 2 ? 'Intermediate' : 'Advanced'}
                    </div>
                )}
            </header>

            <main>
                <div className={`mission-card ${isReciting ? 'mosaic' : ''}`}>
                    <p className={`verse-text ${isReciting ? 'mosaic' : ''}`}>
                        <span style={{ color: '#FF6B6B', display: 'block', fontSize: '1.3rem', fontWeight: '700', marginBottom: '10px' }}>[{displayRef}]</span>
                        "{displayText}"
                    </p>
                    <button id="btn-listen" className="num-btn special" 
                            style={{ width: '100%', height: '50px', marginTop: '10px' }}
                            onClick={() => speak(fullTargetText, setIsWaveActive)}>
                        <Volume2 size={20} style={{ marginRight: '8px' }} /> 말씀 듣기 (Listen)
                    </button>
                </div>

                <div className={`voice-wave ${isReciting || isWaveActive ? 'active' : ''}`}>
                    {[1, 2, 3, 4, 5, 2, 4, 1].map((h, i) => (
                        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>

                <div className="transcript-container" style={{ textAlign: 'center', minHeight: '60px', marginBottom: '20px' }}>
                    <p className="transcript-text" style={{ color: '#636e72', fontStyle: 'italic' }}>
                        {transcript || (isReciting ? "🎤 암송 중입니다..." : "(암송 시작 버튼을 눌러주세요)")}
                    </p>
                    {score !== null && (
                        <div className="score-badge animate-pop" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF6B6B', marginTop: '10px' }}>
                            <span style={{ fontSize: '1rem', color: '#666' }}>점수:</span> {score}점
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                        className={`btn-primary ${isReciting ? 'btn-secondary' : ''}`} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                        onClick={handleToggleRecital}
                    >
                        {isReciting ? <Square size={24} /> : <Mic size={24} />}
                        {isReciting ? "암송 완료 (Finish)" : "암송 시작 (Recite)"}
                    </button>
                    
                    <button className="btn-primary btn-secondary btn-check" 
                            disabled={score === null}
                            onClick={() => onNext(score)}>
                        {userType === 'korean' 
                            ? (score !== null ? "결과 저장하고 완료하기" : "암송 후 완료 가능")
                            : (score >= 85 ? "암송 통과! 보상받기" : "결과 저장하고 완료하기 (85점 미만)")}
                    </button>
                </div>



                <div style={{ marginTop: '30px', textAlign: 'left' }}>
                    <button className="num-btn special" 
                            style={{ width: '180px', height: '55px' }} 
                            onClick={onBack}>
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> 이전으로 (Back)
                    </button>
                </div>
            </main>

            <footer>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: '66%' }}></div>
                </div>
                <div className="step-indicator">
                    <span>말씀 암송</span>
                    <span>66%</span>
                </div>
            </footer>
        </div>
    );
};

export default RecitalStep;
