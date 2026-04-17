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

// Persistent reference to prevent garbage collection (Crucial for Android Chrome)
let lastUtterance = null;

export function speak(text, setWaveActive, callback) {
    if (!window.speechSynthesis) return;

    // 1. Force clear the internal queue immediately
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    // 2. Play a lightweight click SFX (This counts as a user gesture for unlocking audio)
    SFX.play('click');

    // 3. Create a fresh utterance and store it in a persistent variable
    const utterance = new SpeechSynthesisUtterance(text);
    lastUtterance = utterance; // Protect from GC

    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    
    // Watchdog timer: if it fails to start, it's jammed
    let started = false;
    const watchdog = setTimeout(() => {
        if (!started) {
            console.warn("Speech synthesis failed to trigger 'onstart' (Android Queue Jam)");
            if (setWaveActive) setWaveActive(false);
            window.speechSynthesis.resume(); // Try one more nudge
        }
    }, 2000);

    // 4. Attach all listeners BEFORE calling speak
    utterance.onstart = () => {
        started = true;
        clearTimeout(watchdog);
        if (setWaveActive) setWaveActive(true);
    };

    utterance.onend = () => {
        clearTimeout(watchdog);
        if (setWaveActive) setWaveActive(false);
        lastUtterance = null; // Release memory
        if (callback) callback();
    };

    utterance.onerror = (event) => {
        console.error("Speech Synthesis Error:", event.error);
        clearTimeout(watchdog);
        if (setWaveActive) setWaveActive(false);
        lastUtterance = null;
    };

    // 5. Final synchronous call to speak
    window.speechSynthesis.speak(utterance);
}

export function stopSpeak() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
