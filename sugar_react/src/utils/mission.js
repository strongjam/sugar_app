export const SFX = {
    play(type) {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            if (type === 'click') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, context.currentTime);
                gainNode.gain.setValueAtTime(0.1, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
                oscillator.start(); oscillator.stop(context.currentTime + 0.1);
            } else if (type === 'success') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(600, context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.1, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
                oscillator.start(); oscillator.stop(context.currentTime + 0.3);
            }
        } catch(e) {}
    }
};

// Persistent timer for pauses
let speakTimeout = null;
let lastUtterance = null;

// Helper to convert digits to Sino-Korean text (e.g. 55 -> 오십오)
// Essential for preventing TTS engines from reading chapters/verses as countables (e.g. 쉰다섯)
function numberToSinoKorean(n) {
    const units = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    const positions = ["", "십", "백", "천"];
    if (n === 0) return "영";
    let result = "";
    let strNum = n.toString();
    for (let i = 0; i < strNum.length; i++) {
        let digit = parseInt(strNum[i]);
        let pos = strNum.length - 1 - i;
        if (digit !== 0) {
            // Skill '일' (one) for ten/hundred/thousand places in Korean (e.g. 10 is '십', not '일십')
            if (digit === 1 && pos > 0) result += positions[pos];
            else result += units[digit] + positions[pos];
        }
    }
    return result;
}

export async function speak(textOrSegments, setWaveActive, callback) {
    if (!window.speechSynthesis) return;

    // 1. Queue Reset
    window.speechSynthesis.cancel();
    if (speakTimeout) {
        clearTimeout(speakTimeout);
        speakTimeout = null;
    }

    // 2. Normalize, Clean, and Convert Numbers to Text
    let rawSegments = Array.isArray(textOrSegments) ? textOrSegments : [textOrSegments];
    
    // If it's a single string with brackets, try to split it once (Backward compatibility)
    if (rawSegments.length === 1 && typeof rawSegments[0] === 'string' && rawSegments[0].includes(']')) {
        const text = rawSegments[0];
        const splitIdx = text.indexOf(']');
        rawSegments = [
            text.substring(0, splitIdx + 1),
            text.substring(splitIdx + 1).trim()
        ];
    }

    // CLEANING and DIGIT CONVERSION
    const segments = rawSegments
        .map(s => {
            let clean = (s || "").toString().replace(/[\[\]]/g, '').trim();
            // Convert any digits (e.g. "55") to Korean text ("오십오")
            return clean.replace(/\d+/g, (m) => numberToSinoKorean(parseInt(m)));
        })
        .filter(s => s.length > 0);

    // 3. Sequential Execution
    try {
        // Multi-stage breathing room for the engine
        await new Promise(r => { speakTimeout = setTimeout(r, 300); });
        window.speechSynthesis.resume();

        if (setWaveActive) setWaveActive(true);
        SFX.play('click');

        for (let i = 0; i < segments.length; i++) {
            await new Promise((resolve) => {
                const utterance = new SpeechSynthesisUtterance(segments[i]);
                lastUtterance = utterance;
                utterance.lang = 'ko-KR';
                utterance.rate = 0.75; // Slower speed for clarity

                utterance.onend = () => { resolve(); };
                utterance.onerror = (e) => { 
                    console.error("TTS Segment Error:", e);
                    resolve(); // Continue anyway
                };

                window.speechSynthesis.speak(utterance);
                
                // Watchdog to prevent engine sleep
                const watchdog = setInterval(() => {
                    if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
                    else clearInterval(watchdog);
                }, 1000);
            });

            // 4. THE 2-SECOND PAUSE (Between segments only)
            if (i < segments.length - 1) {
                await new Promise(r => { speakTimeout = setTimeout(r, 1000); });
            }
        }
    } catch (err) {
        console.error("TTS Universal Error:", err);
    } finally {
        if (setWaveActive) setWaveActive(false);
        if (callback) callback();
        lastUtterance = null;
    }
}

export function stopSpeak() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (speakTimeout) {
        clearTimeout(speakTimeout);
        speakTimeout = null;
    }
}

export function getSimilarityScore(str1, str2) {
    const normalize = (s) => s.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'“ ”‘ ’·]/g, "").trim();
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    const distance = matrix[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return Math.round(((maxLen - distance) / maxLen) * 100);
}
