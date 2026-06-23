import React, { useEffect, useRef, useState } from 'react';
import './HotseatIntro.css';
import KbcLogo from './KbcLogo';

export default function HotseatIntro({ onComplete, onTransitionStart, contestantName, introTitle }) {
  const [stage, setStage] = useState('start'); // start -> zoom -> flash -> welcome -> fade-out -> finish
  const [showSkip, setShowSkip] = useState(false);
  const audioRef = useRef(null);
  const timersRef = useRef([]);

  const fullTitle = introTitle || "Kaun Banega Crorepati";

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleSkip = () => {
    // 1. Clear all ongoing visual timeline timeouts
    clearAllTimers();
    
    // 2. Start fading out audio smoothly
    if (audioRef.current) {
      const fadeInterval = setInterval(() => {
        if (audioRef.current.volume > 0.05) {
          audioRef.current.volume -= 0.05;
        } else {
          clearInterval(fadeInterval);
          audioRef.current.pause();
        }
      }, 50);
      timersRef.current.push(fadeInterval);
    }
    
    // 3. Immediately trigger onTransitionStart to boot up the arena underneath
    if (onTransitionStart) onTransitionStart();
    
    // 4. Set stage to fade-out
    setStage('fade-out');
    
    // 5. Schedule complete callback
    const skipCompleteTimeout = setTimeout(() => {
      setStage('finish');
      if (onComplete) onComplete();
    }, 2500); // 2.5s is the fade-out duration
    timersRef.current.push(skipCompleteTimeout);
  };

  useEffect(() => {
    // Create audio and attach to ref so skip handler can access it
    const audio = new Audio('/kaunbanegacrorepati.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    const finishIntro = () => {
      setStage('finish');
      const finishTimeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
      timersRef.current.push(finishTimeout);
    };

    // Attempt immediate playback
    const attemptPlay = () => {
      if (!audioRef.current) return;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — retry once on the next user interaction
        const unlockHandler = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          document.removeEventListener('click', unlockHandler, true);
          document.removeEventListener('touchstart', unlockHandler, true);
          document.removeEventListener('keydown', unlockHandler, true);
        };
        document.addEventListener('click', unlockHandler, true);
        document.addEventListener('touchstart', unlockHandler, true);
        document.addEventListener('keydown', unlockHandler, true);
        // Also schedule a forced play after 500ms (host already had a gesture)
        const retryTimer = setTimeout(() => {
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }, 500);
        timersRef.current.push(retryTimer);
      });
    };

    attemptPlay();

    // Make Skip button visible after 3s
    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    timersRef.current.push(skipTimer);

    // Animation sequence timeouts
    const t1 = setTimeout(() => setStage('zoom'), 8000);
    timersRef.current.push(t1);

    const t2 = setTimeout(() => setStage('flash'), 12500);
    timersRef.current.push(t2);

    const t3 = setTimeout(() => setStage('welcome'), 13000);
    timersRef.current.push(t3);

    const t4 = setTimeout(() => {
      setStage('fade-out');
      if (onTransitionStart) onTransitionStart();
    }, 16500);
    timersRef.current.push(t4);

    const t5 = setTimeout(() => {
      if (audioRef.current) {
        const fadeInterval = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume -= 0.05;
          } else {
            clearInterval(fadeInterval);
            if (audioRef.current) audioRef.current.pause();
          }
        }, 100);
        timersRef.current.push(fadeInterval);
      }
      finishIntro();
    }, 19000);
    timersRef.current.push(t5);

    return () => {
      clearAllTimers();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`hotseat-intro-container stage-${stage}`}>
      <div className="drone-camera">
        <div className="intro-rings">
          <div className="intro-floor-grid"></div>
          <div className="intro-ring ring-1"></div>
          <div className="intro-ring ring-2"></div>
          <div className="intro-ring ring-3"></div>
          <div className="intro-ring ring-4"></div>
        </div>
        <div className="intro-spotlight"></div>
        <div className="intro-spotlight-beam beam-left"></div>
        <div className="intro-spotlight-beam beam-right"></div>
      </div>
      
      <div className="intro-content" style={{ opacity: (stage === 'start' || stage === 'welcome' || stage === 'fade-out' || stage === 'finish') ? 0 : 1, transition: 'opacity 1s ease' }}>
        <KbcLogo title={fullTitle} />
        
        <div className="intro-player-card">
          <p className="intro-subtitle">HOTSEAT CONTENDER</p>
          <h2 className="intro-name">{contestantName || 'CONTESTANT'}</h2>
        </div>
      </div>

      <div className={`intro-welcome-msg ${(stage === 'welcome' || stage === 'fade-out') ? 'visible' : ''}`} style={{ opacity: stage === 'fade-out' ? 0 : undefined }}>
        <h1 className="welcome-text">WELCOME TO THE HOTSEAT</h1>
        <p className="welcome-subtext">The ultimate test of knowledge begins now.</p>
      </div>

      <div className="intro-flash-overlay"></div>

      {showSkip && stage !== 'fade-out' && stage !== 'finish' && (
        <button className="intro-skip-btn" onClick={handleSkip}>
          SKIP INTRO ⏩
        </button>
      )}
    </div>
  );
}
