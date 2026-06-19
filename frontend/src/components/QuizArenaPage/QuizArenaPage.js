import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  verifyQuizAccess,
  getQuizLiveState,
  submitFFFAnswer,
  getHotseatQuestion,
  submitHotseatAnswer,
  hotseatWalkAway,
  startQuizAttempt,
  getNextQuestion,
  submitQuizAnswer,
  hotseatPreselect,
  getMyRegistration,
  hostLockAnswer,
  getHostHotseatQuestion,
  requestHotseatLifeline,
  acknowledgeHotseatLifeline,
  approveHotseatLifeline,
  rejectHotseatLifeline,
  hostShowOptions,
  hostPauseTimer,
  hostResumeTimer,
  hostNextQuestion,
  hostTriggerIntro,
  hostCompleteIntro,
  getSwitchCategories,
  selectHotseatSwitchCategory,
  confirmHotseatSwitchCategory,
  submitSpectatorVote,
  pressBuzzer
} from '../../api/quizzes';
import { getAuthSession } from '../../api/auth';
import KbcStageFx from '../KbcStageFx/KbcStageFx';
import HotseatIntro from './HotseatIntro';
import './QuizArenaPage.css';

const SYMBOLS = {
  triangle: '\u25B3',
  circle: '\u25CB',
  square: '\u25A1',
  diamond: '\u25C7',
  star: '\u2605',
};

const SCORE_LADDER = [
  { level: 15, score: 10000000, checkpoint: false },
  { level: 14, score: 5000000, checkpoint: false },
  { level: 13, score: 2500000, checkpoint: false },
  { level: 12, score: 1250000, checkpoint: false },
  { level: 11, score: 640000, checkpoint: false },
  { level: 10, score: 320000, checkpoint: true },
  { level: 9,  score: 160000, checkpoint: false },
  { level: 8,  score: 80000, checkpoint: false },
  { level: 7,  score: 40000, checkpoint: false },
  { level: 6,  score: 20000, checkpoint: false },
  { level: 5,  score: 10000, checkpoint: true },
  { level: 4,  score: 5000, checkpoint: false },
  { level: 3,  score: 3000, checkpoint: false },
  { level: 2,  score: 2000, checkpoint: false },
  { level: 1,  score: 1000, checkpoint: false }
];

const formatPoints = (score) => {
  return `${score.toLocaleString('en-IN')}`;
};

function QuizArenaInner({ showBeautifulPopup }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();
  const [theme] = useState(() => localStorage.getItem('quizverse-theme') || 'dark');
  const isLight = theme === 'light';

  // Verification Credentials State
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(`quiz-${id}-player-id`) || '');
  const [eventPassword, setEventPassword] = useState(() => localStorage.getItem(`quiz-${id}-event-password`) || '');
  const [isVerified, setIsVerified] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'host') return true;
    return sessionStorage.getItem(`quiz-${id}-verified`) === 'true';
  });
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');


  // Fullscreen and Trivia states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prelimFeedback, setPrelimFeedback] = useState(null);
  
  const [showHotseatIntro, setShowHotseatIntro] = useState(false);
  const [showLocalTestIntro, setShowLocalTestIntro] = useState(false);
  const [poweringOn, setPoweringOn] = useState(false);
  const [hasSeenHotseatIntro, setHasSeenHotseatIntro] = useState(false);

  // Main Live Stage States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveState, setLiveState] = useState(null);
  const [buzzerTimeRemaining, setBuzzerTimeRemaining] = useState(15);
  const [buzzerPressId, setBuzzerPressId] = useState('');
  const [buzzerError, setBuzzerError] = useState('');
  const [buzzerSuccess, setBuzzerSuccess] = useState('');
  const [isBuzzingLocal, setIsBuzzingLocal] = useState(false);

  const liveStateRef = useRef(liveState);
  useEffect(() => {
    liveStateRef.current = liveState;
  }, [liveState]);

  const prevActiveBuzzerIdRef = useRef(null);
  const prevIncorrectBuzzersCountRef = useRef(null);

  const playAudio = (src) => {
    try {
      const audio = new Audio(src);
      audio.play().catch(e => console.warn("Audio play blocked or failed:", e));
    } catch (e) {
      console.warn("Audio playback not supported:", e);
    }
  };

  useEffect(() => {
    const activeBuzzerId = liveState?.buzzer_state?.active_buzzer_id;
    if (activeBuzzerId && activeBuzzerId !== prevActiveBuzzerIdRef.current) {
      playAudio('/press buzzzer.mp3');
    }
    prevActiveBuzzerIdRef.current = activeBuzzerId;
  }, [liveState?.buzzer_state?.active_buzzer_id]);

  useEffect(() => {
    const incorrectList = liveState?.buzzer_state?.incorrect_buzzers || [];
    if (prevIncorrectBuzzersCountRef.current !== null) {
      if (incorrectList.length > prevIncorrectBuzzersCountRef.current) {
        playAudio('/incorrect answer.mp3');
      }
    }
    prevIncorrectBuzzersCountRef.current = incorrectList.length;
  }, [liveState?.buzzer_state?.incorrect_buzzers]);



  useEffect(() => {
    let interval = null;
    const bState = liveState?.buzzer_state;
    if (bState?.is_timer_running && bState?.timer_started_at) {
      const limit = bState.answer_timer_limit || 15;
      const startedAt = new Date(bState.timer_started_at).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = (now - startedAt) / 1000;
        const rem = Math.max(0, limit - elapsed);
        setBuzzerTimeRemaining(rem);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 100);
    } else {
      setBuzzerTimeRemaining(bState?.answer_timer_limit || 15);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveState?.buzzer_state?.is_timer_running, liveState?.buzzer_state?.timer_started_at, liveState?.buzzer_state?.answer_timer_limit]);

  // Entry stage machine: 'role_selection', 'credentials', 'instructions', 'active'
  const [userSelectedRole, setUserSelectedRole] = useState(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'host') return 'host';
    
    const savedPlayerId = localStorage.getItem(`quiz-${id}-player-id`);
    if (savedPlayerId) {
      return 'participant';
    }
    
    return sessionStorage.getItem(`quiz-${id}-role`) || null;
  });

  const [entryStage, setEntryStage] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('role') === 'host') return 'active';
    
    const savedRole = sessionStorage.getItem(`quiz-${id}-role`);
    const savedEntered = sessionStorage.getItem(`quiz-${id}-entered`) === 'true';
    
    const savedPlayerId = localStorage.getItem(`quiz-${id}-player-id`);
    if (savedPlayerId) {
      const isVerifiedNow = sessionStorage.getItem(`quiz-${id}-verified`) === 'true';
      if (isVerifiedNow && savedEntered) return 'active';
      if (isVerifiedNow) return 'instructions';
      return 'credentials';
    }
    
    if (savedRole && savedEntered) return 'active';
    if (savedRole) return 'instructions';
    return 'role_selection';
  });

  const [isEntered, setIsEntered] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('role') === 'host') return true;
    return sessionStorage.getItem(`quiz-${id}-entered`) === 'true';
  });

  // Save entry state to sessionStorage for smooth refresh
  useEffect(() => {
    if (userSelectedRole) {
      sessionStorage.setItem(`quiz-${id}-role`, userSelectedRole);
    } else {
      sessionStorage.removeItem(`quiz-${id}-role`);
    }
    sessionStorage.setItem(`quiz-${id}-stage`, entryStage || 'role_selection');
    sessionStorage.setItem(`quiz-${id}-verified`, isVerified ? 'true' : 'false');
    sessionStorage.setItem(`quiz-${id}-entered`, isEntered ? 'true' : 'false');
  }, [id, userSelectedRole, entryStage, isVerified, isEntered]);

  // Preliminary Round (regular) States
  const [prelimQuestion, setPrelimQuestion] = useState(null);
  const [prelimTotal, setPrelimTotal] = useState(0);
  const [prelimIndex, setPrelimIndex] = useState(0);
  const [prelimSelected, setPrelimSelected] = useState(null);
  const [prelimTimeLeft, setPrelimTimeLeft] = useState(90);
  const [prelimSubmitting, setPrelimSubmitting] = useState(false);
  const [prelimInitialized, setPrelimInitialized] = useState(false);
  const prelimTimerRef = useRef(null);

  // FFF States
  const [fffTimeLeft, setFffTimeLeft] = useState(20);
  const [fffSelectedChoice, setFffSelectedChoice] = useState(null);
  const [fffSelectedSequence, setFffSelectedSequence] = useState([]);
  const [fffAnswered, setFffAnswered] = useState(false);
  const [fffTimeTaken, setFffTimeTaken] = useState(null);
  const fffTimerRef = useRef(null);
  const fffStartTimeRef = useRef(null);

  // Hotseat States
  const [hotseatQuestion, setHotseatQuestion] = useState(null);
  const [hotseatIndex, setHotseatIndex] = useState(0);
  const [hotseatTotal, setHotseatTotal] = useState(15);
  const [hotseatScore, setHotseatScore] = useState(0);
  const [hotseatCompleted, setHotseatCompleted] = useState(false);
  const [hotseatStatus, setHotseatStatus] = useState('');
  const [submittingHotseat, setSubmittingHotseat] = useState(false);
  const [selectedHotseatChoice, setSelectedHotseatChoice] = useState(null);

  // Lifelines Frontend State
  const [eliminatedChoiceIds, setEliminatedChoiceIds] = useState([]);
  const [pollVotes, setPollVotes] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollAnimating, setPollAnimating] = useState(false);
  const [pollAnimVotes, setPollAnimVotes] = useState({});
  const pollAnimRef = useRef(null);
  const [pollTimeLeft, setPollTimeLeft] = useState(0);
  const [spectatorVotedChoiceId, setSpectatorVotedChoiceId] = useState(null);
  const [submittingSpectatorVote, setSubmittingSpectatorVote] = useState(false);
  const hotseatTimerRef = useRef(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchCategories, setSwitchCategories] = useState(["Science", "Bollywood", "History", "Sports", "General"]);
  const [hostHotseatData, setHostHotseatData] = useState(null);
  const [lockingHotseat, setLockingHotseat] = useState(false);
  const [hotseatTimeLeft, setHotseatTimeLeft] = useState(null);
  const [revealedChoicesCount, setRevealedChoicesCount] = useState(0);
  const [approvingLifeline, setApprovingLifeline] = useState(false);
  const [rejectingLifeline, setRejectingLifeline] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [switchCategoriesList, setSwitchCategoriesList] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submittingCategoryChoice, setSubmittingCategoryChoice] = useState(false);

  const lastFetchedQuestionIndexRef = useRef(null);
  const lastFetchedSwitchedRef = useRef(null);
  const lastFetchedShowingRef = useRef(null);

  const handleHotseatTimeout = async () => {
    if (submittingHotseat) return;
    try {
      setSubmittingHotseat(true);
      const res = await submitHotseatAnswer(id, null, session?.token);
      setHotseatCompleted(true);
      setHotseatStatus('failed');
      setHotseatScore(res.checkpoint_points || 0);
      showBeautifulPopup("TIME OUT!", `Time ran out! You have been dropped to ${formatPoints(res.checkpoint_points || 0)}.`, 'error');
    } catch (err) {
      console.error("Timeout submit failed:", err);
    } finally {
      setSubmittingHotseat(false);
    }
  };

  // Polling intervals reference
  const pollingRef = useRef(null);

  // Check live state on mount and register fullscreen listener
  useEffect(() => {
    const initFetch = async () => {
      try {
        const data = await getQuizLiveState(id, session?.token);
        setLiveState(data);
      } catch (err) {
        console.error("Initial live state fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initFetch();

    const handleFsChange = () => {
      const fs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(fs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(prelimTimerRef.current);
      clearInterval(fffTimerRef.current);
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  // Fetch actual registration details on mount to prevent stale localStorage player-id bugs
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const token = session?.token;
        if (!token) return;
        const reg = await getMyRegistration(id, token);
        if (reg.registered) {
          // If the player ID is different from what we had in localStorage, correct it!
          const storedPlayerId = localStorage.getItem(`quiz-${id}-player-id`);
          if (storedPlayerId !== reg.player_id) {
            setPlayerId(reg.player_id);
            localStorage.setItem(`quiz-${id}-player-id`, reg.player_id);
          }
        }
      } catch (err) {
        console.error("Failed to check current registration details:", err);
      }
    };
    checkRegistration();
  }, [id, session?.token]);

  // Handle auto-role selection from query parameters (for host)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'host' && session?.user?.role === 'admin') {
      setUserSelectedRole('host');
      setIsVerified(true);
      setEntryStage('active');
      setIsEntered(true);
    }
  }, [location.search, session]);

  // Poll live state once verified with safety against overlapping requests
  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const poll = async () => {
      if (!active) return;
      try {
        await fetchLiveState();
      } catch (err) {
        console.error("Overlapping arena poll error:", err);
      } finally {
        if (active) {
          // Schedule next poll ONLY after current request completes
          timeoutId = setTimeout(poll, 2000);
        }
      }
    };

    if (isVerified) {
      poll();
    }

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVerified]);

  // Reset spectator local vote state when the active question changes
  useEffect(() => {
    setSpectatorVotedChoiceId(null);
    setSubmittingSpectatorVote(false);
  }, [hotseatQuestion?.id, liveState?.hotseat_attempt?.current_question_index]);

  // Synchronized spectator voting countdown timer
  useEffect(() => {
    const approvedData = liveState?.hotseat_attempt?.approved_lifeline_data || {};
    const pollStartTimeStr = approvedData?.poll_start_time;
    if (!pollStartTimeStr || liveState?.hotseat_attempt?.pending_lifeline_type !== 'poll' || liveState?.hotseat_attempt?.lifeline_request_status !== 'approved') {
      setPollTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const startTime = new Date(pollStartTimeStr).getTime();
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(15 - elapsed));
      setPollTimeLeft(remaining);
      return remaining;
    };

    const remaining = updateTimer();
    if (remaining <= 0) return;

    const timer = setInterval(() => {
      const rem = updateTimer();
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [liveState?.hotseat_attempt?.approved_lifeline_data?.poll_start_time, liveState?.hotseat_attempt?.pending_lifeline_type, liveState?.hotseat_attempt?.lifeline_request_status]);


  // Sync state transitions & FFF timers
  useEffect(() => {
    if (!liveState) return;

    // Initialize preliminary round if stage is regular, quiz is live, and participant has successfully entered
    if (liveState.current_stage === 'regular' && liveState.status === 'live' && !prelimInitialized && !loading && userSelectedRole === 'participant' && entryStage === 'active' && isEntered) {
      initializePrelim();
    }

    const isHotseatStage = liveState.current_stage.startsWith('hotseat_batch_');
    if (isHotseatStage) {
      if (liveState.hotseat_attempt?.show_intro) {
        if (!hasSeenHotseatIntro) {
          setShowHotseatIntro(true);
        }
      } else {
        setShowHotseatIntro(false);
        setHasSeenHotseatIntro(false);
      }
    } else {
      setShowHotseatIntro(false);
      setHasSeenHotseatIntro(false);
    }

    const isFffStage = liveState.current_stage.startsWith('fff_batch_');
    if (isFffStage && liveState.is_in_active_batch && !liveState.fff_answered && !fffAnswered) {
      if (!fffTimerRef.current) {
        const timerLimit = liveState?.fff_speed_timer || 20;
        setFffTimeLeft(timerLimit);
        fffStartTimeRef.current = performance.now();
        fffTimerRef.current = setInterval(() => {
          setFffTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(fffTimerRef.current);
              fffTimerRef.current = null;
              // Auto submit blank on timeout
              handleFFFSubmit(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (fffTimerRef.current) {
        clearInterval(fffTimerRef.current);
        fffTimerRef.current = null;
      }
    }

    // Load active hotseat question if hotseat round is active
    if (isHotseatStage) {
      if (userSelectedRole === 'host') {
        loadHostHotseatQuestion();
      } else {
        const attempt = liveState?.hotseat_attempt;
        const indexChanged = lastFetchedQuestionIndexRef.current !== attempt?.current_question_index;
        const switchedChanged = lastFetchedSwitchedRef.current !== attempt?.current_question_switched;
        const showingChanged = lastFetchedShowingRef.current !== attempt?.showing_question;

        if (!hotseatQuestion || indexChanged || switchedChanged || showingChanged) {
          loadHotseatQuestion();
          lastFetchedQuestionIndexRef.current = attempt?.current_question_index;
          lastFetchedSwitchedRef.current = attempt?.current_question_switched;
          lastFetchedShowingRef.current = attempt?.showing_question;
        }
      }
    }
  }, [liveState, prelimQuestion, prelimInitialized, loading, userSelectedRole, fffAnswered, entryStage, isEntered]);

  // Hotseat countdown timer interval manager
  useEffect(() => {
    if (hotseatTimeLeft === null) {
      if (hotseatTimerRef.current) {
        clearInterval(hotseatTimerRef.current);
        hotseatTimerRef.current = null;
      }
      return;
    }

    if (hotseatTimeLeft <= 0) {
      if (hotseatTimerRef.current) {
        clearInterval(hotseatTimerRef.current);
        hotseatTimerRef.current = null;
      }
      handleHotseatTimeout();
      return;
    }

    if (!hotseatTimerRef.current) {
      hotseatTimerRef.current = setInterval(() => {
        // Only tick down if:
        // 1. Choices are revealed by Host
        // 2. Timer is not manually paused by Host
        // 3. No pending lifeline request in progress
        const attempt = liveStateRef.current?.hotseat_attempt;
        const optionsVisible = attempt?.options_visible;
        const timerPaused = attempt?.timer_is_paused;
        const lifelinePending = attempt?.lifeline_request_status === 'requested';

        if (optionsVisible && !timerPaused && !lifelinePending) {
          setHotseatTimeLeft((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
              clearInterval(hotseatTimerRef.current);
              hotseatTimerRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (hotseatTimeLeft <= 0 && hotseatTimerRef.current) {
        clearInterval(hotseatTimerRef.current);
        hotseatTimerRef.current = null;
      }
    };
  }, [hotseatTimeLeft]);

  // Handle staggered sequential option reveals (A, B, C, D) in KBC style
  useEffect(() => {
    const attempt = liveState?.hotseat_attempt;
    if (attempt?.options_visible) {
      if (revealedChoicesCount === 4) return;
      
      setRevealedChoicesCount(1); // First choice immediately
      
      const t2 = setTimeout(() => setRevealedChoicesCount(2), 700);
      const t3 = setTimeout(() => setRevealedChoicesCount(3), 1400);
      const t4 = setTimeout(() => setRevealedChoicesCount(4), 2100);
      
      return () => {
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      setRevealedChoicesCount(0);
    }
  }, [liveState?.hotseat_attempt?.options_visible, liveState?.hotseat_attempt?.current_question_index]);

  // Handle stateful lifeline request status updates
  useEffect(() => {
    if (!liveState) return;

    const attempt = liveState.hotseat_attempt;
    const isHotseat = liveState.student_role === 'hotseat_player';

    if (!isHotseat || !attempt || attempt.pending_lifeline_type !== 'switch' || attempt.lifeline_request_status !== 'approved') {
      if (showCategorySelector) {
        setShowCategorySelector(false);
      }
    }

    if (!isHotseat || !attempt) return;
    
    const requestStatus = attempt.lifeline_request_status;
    const pendingType = attempt.pending_lifeline_type;
    
    if (requestStatus === 'approved') {
      const applyApprovedLifeline = async () => {
        try {
          const approvedData = attempt.approved_lifeline_data || {};
          if (pendingType === '5050' && approvedData.eliminated_choice_ids) {
            setEliminatedChoiceIds(approvedData.eliminated_choice_ids);
            showBeautifulPopup("50:50 Lifeline Approved!", "Two incorrect choices have been eliminated.", "success");
            await acknowledgeHotseatLifeline(id, session?.token);
          } else if (pendingType === 'poll' && approvedData.poll_start_time) {
            const finalVotes = approvedData.votes || {};
            setPollVotes(finalVotes);
            setShowPollModal(true);
            setPollAnimating(!approvedData.votes_closed);
          } else if (pendingType === 'switch') {
            if (!showCategorySelector && switchCategoriesList.length === 0 && !loadingCategories) {
              try {
                setLoadingCategories(true);
                const list = await getSwitchCategories(id, session?.token);
                setSwitchCategoriesList(list);
                setSelectedCategoryId(null);
                setShowCategorySelector(true);
              } catch (err) {
                console.error("Failed to load switch categories:", err);
                showBeautifulPopup("Error", "Failed to load custom categories for the Switch lifeline.", "error");
              } finally {
                setLoadingCategories(false);
              }
            }
          } else if (pendingType === 'walkaway') {
            await acknowledgeHotseatLifeline(id, session?.token);
          }
        } catch (err) {
          console.error("Failed to apply approved lifeline: ", err);
        }
      };
      
      applyApprovedLifeline();
    } else if (requestStatus === 'rejected') {
      const applyRejectedLifeline = async () => {
        try {
          if (pendingType === 'walkaway') {
            showBeautifulPopup("Walk Away Request Denied", "The host has rejected your request to walk away. You must continue playing!", "error");
          } else {
            const typeName = pendingType === '5050' ? '50:50' : pendingType === 'poll' ? 'Audience Poll' : 'Switch Question';
            showBeautifulPopup("Lifeline Request Denied", `The host has rejected your request to use the ${typeName} lifeline.`, "error");
          }
          await acknowledgeHotseatLifeline(id, session?.token);
        } catch (err) {
          console.error("Failed to acknowledge rejected lifeline: ", err);
        }
      };
      
      applyRejectedLifeline();
    }
  }, [liveState, hotseatQuestion]);

  const handleSelectParticipant = async () => {
    if (playerId) {
      try {
        setVerifying(true);
        setVerificationError('');
        await verifyQuizAccess(id, playerId, eventPassword, session?.token);
        setIsVerified(true);
        setUserSelectedRole('participant');
        setEntryStage('instructions');
      } catch (err) {
        // Clear stored credentials and ask to input again
        setPlayerId('');
        setEventPassword('');
        localStorage.removeItem(`quiz-${id}-player-id`);
        localStorage.removeItem(`quiz-${id}-event-password`);
        setUserSelectedRole('participant');
        setEntryStage('credentials');
      } finally {
        setVerifying(false);
      }
    } else {
      setUserSelectedRole('participant');
      setEntryStage('credentials');
    }
  };

  const handleSelectSpectator = () => {
    setUserSelectedRole('spectator');
    setIsVerified(true);
    setEntryStage('active');
  };

  const handleSelectHost = () => {
    setUserSelectedRole('host');
    setIsVerified(true);
    setEntryStage('active');
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
      setIsFullscreen(true);
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
      setIsFullscreen(true);
    }
  };

  const handleVerifyAccessSubmit = async (e) => {
    e.preventDefault();
    if (!playerId) {
      setVerificationError('Please enter your Player ID');
      return;
    }
    try {
      setVerifying(true);
      setVerificationError('');
      await verifyQuizAccess(id, playerId, eventPassword, session?.token);
      localStorage.setItem(`quiz-${id}-player-id`, playerId);
      localStorage.setItem(`quiz-${id}-event-password`, eventPassword);
      setIsVerified(true);
      setEntryStage('instructions');
    } catch (err) {
      setVerificationError(err.message || 'Access Verification Failed. Check credentials.');
    } finally {
      setVerifying(false);
    }
  };

  const fetchLiveState = async () => {
    try {
      const data = await getQuizLiveState(id, session?.token);
      setLiveState(data);
    } catch (err) {
      setError(err.message || 'Error communicating with Live Arena.');
    }
  };

  // ==========================================
  // PRELIMINARY ROUND HANDLERS (regular)
  // ==========================================
  const initializePrelim = async () => {
    try {
      setLoading(true);
      setPrelimInitialized(true);
      await startQuizAttempt(id, session?.token);
      await loadPrelimQuestion();
    } catch (err) {
      // In case attempt already started or completed
      await loadPrelimQuestion();
    } finally {
      setLoading(false);
    }
  };

  const loadPrelimQuestion = async () => {
    try {
      const data = await getNextQuestion(id, session?.token);
      if (data.completed) {
        setPrelimQuestion(null);
        return;
      }
      setPrelimQuestion(data.question);
      setPrelimTotal(data.question.total_questions);
      setPrelimIndex(data.question.current_index);
      setPrelimSelected(null);
      const timerLimit = liveState?.prelim_mcq_timer || 90;
      setPrelimTimeLeft(timerLimit);
      startPrelimTimer();
    } catch (err) {
      setError('Failed to load next preliminary question.');
    }
  };

  const startPrelimTimer = () => {
    clearInterval(prelimTimerRef.current);
    prelimTimerRef.current = setInterval(() => {
      setPrelimTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prelimTimerRef.current);
          handlePrelimTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePrelimTimeUp = () => {
    const timerLimit = liveState?.prelim_mcq_timer || 90;
    submitPrelimAnswer(null, timerLimit);
  };

  const submitPrelimAnswer = async (choiceId, timeTaken = null) => {
    try {
      setPrelimSubmitting(true);
      clearInterval(prelimTimerRef.current);
      const timerLimit = liveState?.prelim_mcq_timer || 90;
      const actualTime = timeTaken !== null ? timeTaken : timerLimit - prelimTimeLeft;
      const res = await submitQuizAnswer(id, choiceId, actualTime, session?.token);
      
      // Bypass the trivia screen entirely in round 1 (preliminary round).
      // Immediately load the next question or set prelimQuestion to null to indicate completion.
      if (res.completed) {
        setPrelimQuestion(null);
      } else {
        await loadPrelimQuestion();
      }
    } catch (err) {
      setError('Failed to submit preliminary answer.');
    } finally {
      setPrelimSubmitting(false);
    }
  };

  const handleProceedFromTrivia = async () => {
    const wasCompleted = prelimFeedback?.completed;
    setPrelimFeedback(null);
    if (wasCompleted) {
      setPrelimQuestion(null);
    } else {
      await loadPrelimQuestion();
    }
  };

  // ==========================================
  // FASTEST FINGER FIRST ROUND HANDLERS
  // ==========================================
  const handleFFFChoiceClick = (choiceId) => {
    if (fffAnswered) return;
    if (fffSelectedSequence.includes(choiceId)) {
      // Remove if clicked again
      setFffSelectedSequence(fffSelectedSequence.filter(id => id !== choiceId));
    } else {
      // Add to sequence
      setFffSelectedSequence([...fffSelectedSequence, choiceId]);
    }
  };

  const handleResetFFFSequence = () => {
    if (fffAnswered) return;
    setFffSelectedSequence([]);
  };

  const handleFFFSubmit = async () => {
    if (fffAnswered) return;
    try {
      clearInterval(fffTimerRef.current);
      fffTimerRef.current = null;
      
      const endTime = performance.now();
      const elapsed = ((endTime - fffStartTimeRef.current) / 1000).toFixed(3);
      const timerLimit = liveState?.fff_speed_timer || 20;
      const seconds = Math.min(parseFloat(timerLimit), parseFloat(elapsed));

      const firstChoiceId = fffSelectedSequence[0] || null;
      setFffSelectedChoice(firstChoiceId);
      setFffAnswered(true);
      setFffTimeTaken(seconds);

      await submitFFFAnswer(id, firstChoiceId, seconds, session?.token, fffSelectedSequence);
    } catch (err) {
      console.error("Error submitting FFF answer: ", err);
    }
  };

  const handleBuzzerClick = async (customBuzzerId = null) => {
    const bId = customBuzzerId || buzzerPressId;
    if (!bId) {
      setBuzzerError("Please select/enter a Buzzer ID.");
      return;
    }
    
    setBuzzerError("");
    setBuzzerSuccess("");
    setIsBuzzingLocal(true);
    
    try {
      const session = getAuthSession();
      const res = await pressBuzzer(id, bId, session?.token);
      if (res.success) {
        if (res.active_buzzer_id === bId) {
          setBuzzerSuccess(`🚨 BOOM! You buzzed fastest! You have the turn!`);
        } else {
          setBuzzerSuccess(`Buzzer press registered! You are in the queue.`);
        }
        if (res.active_buzzer_id && res.active_buzzer_id !== prevActiveBuzzerIdRef.current) {
          playAudio('/press buzzzer.mp3');
          prevActiveBuzzerIdRef.current = res.active_buzzer_id;
        }
      }
    } catch (err) {
      setBuzzerError(err.message || "Buzzer press failed.");
    } finally {
      setIsBuzzingLocal(false);
    }
  };

  // ==========================================
  // HOTSEAT ROUND HANDLERS
  // ==========================================
  const loadHotseatQuestion = async () => {
    try {
      const data = await getHotseatQuestion(id, session?.token);
      if (data.completed) {
        setHotseatCompleted(true);
        setHotseatStatus(data.status);
        setHotseatScore(data.score);
        setHotseatQuestion(null);
      } else {
        setHotseatCompleted(false);
        // Clear choice selection and 50:50 fades ONLY when switching to a NEW question
        if (!hotseatQuestion || hotseatQuestion.id !== data.question.id) {
          setHotseatQuestion(data.question);
          setSelectedHotseatChoice(data.preselected_choice_id);
          setEliminatedChoiceIds([]);
          setPollVotes(null);

          // Configure timer limit for Hotseat Q1-15 dynamically from preferences:
          // Q1 - Q5 (indices 0 - 4)
          // Q6 - Q10 (indices 5 - 9)
          // Q11 - Q15 (indices 10 - 14): Infinite (null)
          const qIndex = data.current_index;
          let limit = null;
          if (qIndex < 5) {
            limit = liveState?.hotseat_q1_q5_limit !== undefined ? liveState.hotseat_q1_q5_limit : 60;
          } else if (qIndex < 10) {
            limit = liveState?.hotseat_q6_q10_limit !== undefined ? liveState.hotseat_q6_q10_limit : 120;
          }
          setHotseatTimeLeft(limit);
        } else {
          if (!submittingHotseat) {
            setSelectedHotseatChoice(data.preselected_choice_id);
          }
        }
        setHotseatTotal(data.total_questions);
        setHotseatIndex(data.current_index);
        setHotseatScore(data.score);
      }
    } catch (err) {
      // Hotseat question might return 404/400 if not ready or completed
      console.log("Hotseat question details not loaded yet or active.");
    }
  };

  const loadHostHotseatQuestion = async () => {
    try {
      const data = await getHostHotseatQuestion(id, session?.token);
      setHostHotseatData(data);
      if (data.active && data.question) {
        setHotseatTotal(data.total_questions);
        setHotseatIndex(data.current_index);
        setHotseatScore(data.score);
      }
    } catch (err) {
      console.log("Host Hotseat question not loaded yet or active:", err);
    }
  };

  const handleHostLockAnswer = async () => {
    if (lockingHotseat) return;
    try {
      setLockingHotseat(true);
      const res = await hostLockAnswer(id, session?.token);
      showBeautifulPopup("Answer Locked", res.message || "Contestant answer has been locked successfully.", "success");
      await loadHostHotseatQuestion();
    } catch (err) {
      showBeautifulPopup("Error Locking Answer", err.message || 'Failed to lock hotseat answer.', "error");
    } finally {
      setLockingHotseat(false);
    }
  };

  const handleHostShowOptions = async () => {
    try {
      const res = await hostShowOptions(id, session?.token);
      setHostHotseatData(res.attempt);
      showBeautifulPopup("Options Revealed", "Choices are now appearing sequentially on the contestant's screen and their timer has started!", "success");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to reveal options.", "error");
    }
  };

  const handleHostPauseTimer = async () => {
    try {
      const res = await hostPauseTimer(id, session?.token);
      setHostHotseatData(res.attempt);
      showBeautifulPopup("Timer Paused", "The contestant's countdown timer has been frozen.", "warning");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to pause timer.", "error");
    }
  };

  const handleHostResumeTimer = async () => {
    try {
      const res = await hostResumeTimer(id, session?.token);
      setHostHotseatData(res.attempt);
      showBeautifulPopup("Timer Resumed", "The contestant's countdown timer has resumed ticking.", "success");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to resume timer.", "error");
    }
  };

  const handleHostNextQuestion = async () => {
    try {
      const res = await hostNextQuestion(id, session?.token);
      setHostHotseatData(res.attempt);
      showBeautifulPopup("Question Pushed", "The new question has been pushed to the contestant's screen. Choices are currently hidden.", "success");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to push question.", "error");
    }
  };

  const handleHostTriggerIntro = async () => {
    try {
      const res = await hostTriggerIntro(id, session?.token);
      setHostHotseatData(res.attempt);
      if (res.attempt?.show_intro) {
        setShowHotseatIntro(true);
      }
      showBeautifulPopup("Intro Started", "KBC Entrance Intro plays simultaneously on all participant & spectator screens!", "success");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to trigger intro playback.", "error");
    }
  };

  const handleHostCompleteIntro = async () => {
    try {
      const res = await hostCompleteIntro(id, session?.token);
      setHostHotseatData(res.attempt);
      setShowHotseatIntro(false);
      setHasSeenHotseatIntro(false);
      showBeautifulPopup("Intro Completed", "Intro ended. Game board has been unlocked for play!", "success");
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to conclude intro playback.", "error");
    }
  };

  const handleLadderLevelClick = (levelQ) => {
    if (userSelectedRole !== 'host') return;
    const currentQ = hotseatIndex + 1;
    if (levelQ > currentQ) {
      showBeautifulPopup("Question Not Reached", `🚫 You have not reached Question ${levelQ} yet! The contestant is currently playing Question ${currentQ}.`, "info");
    } else if (levelQ < currentQ) {
      showBeautifulPopup("Question Completed", `ℹ️ Question ${levelQ} has already been completed.`, "info");
    } else {
      showBeautifulPopup("Question In Progress", `✨ Contestant is currently playing Question ${levelQ} for ${formatPoints(SCORE_LADDER.find(l => l.level === levelQ)?.score || 0)}!`, "success");
    }
  };

  const handleApproveLifeline = async () => {
    if (approvingLifeline) return;
    try {
      setApprovingLifeline(true);
      const isWalkaway = hostHotseatData?.pending_lifeline_type === 'walkaway';
      await approveHotseatLifeline(id, session?.token);
      if (isWalkaway) {
        showBeautifulPopup("Walk Away Approved", "Contestant walk-away request has been approved. The game has concluded.", "success");
      } else {
        showBeautifulPopup("Approved", "Lifeline request has been approved.", "success");
      }
      await loadHostHotseatQuestion();
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to approve lifeline.", "error");
    } finally {
      setApprovingLifeline(false);
    }
  };

  const handleRejectLifeline = async () => {
    if (rejectingLifeline) return;
    try {
      setRejectingLifeline(true);
      const isWalkaway = hostHotseatData?.pending_lifeline_type === 'walkaway';
      await rejectHotseatLifeline(id, session?.token);
      if (isWalkaway) {
        showBeautifulPopup("Walk Away Rejected", "Contestant walk-away request has been rejected.", "info");
      } else {
        showBeautifulPopup("Rejected", "Lifeline request has been rejected.", "info");
      }
      await loadHostHotseatQuestion();
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to reject lifeline.", "error");
    } finally {
      setRejectingLifeline(false);
    }
  };

  const [confirmingSwitch, setConfirmingSwitch] = useState(false);

  const handleHostConfirmSwitch = async () => {
    if (confirmingSwitch) return;
    try {
      setConfirmingSwitch(true);
      await confirmHotseatSwitchCategory(id, session?.token);
      showBeautifulPopup("Question Switched", "Question has been successfully switched!", "success");
      await loadHostHotseatQuestion();
    } catch (err) {
      showBeautifulPopup("Error", err.message || "Failed to switch question.", "error");
    } finally {
      setConfirmingSwitch(false);
    }
  };

  const handleHotseatChoiceClick = async (choiceId) => {
    if (liveState?.student_role !== 'hotseat_player' || submittingHotseat) return;
    if (eliminatedChoiceIds.includes(choiceId)) return; // 50:50 locked out
    const newChoiceId = selectedHotseatChoice === choiceId ? null : choiceId;
    setSelectedHotseatChoice(newChoiceId);
    try {
      await hotseatPreselect(id, newChoiceId, session?.token);
    } catch (err) {
      console.error("Failed to preselect choice:", err);
    }
  };

  const handleWalkAway = () => {
    showBeautifulPopup(
      "Confirm Walk Away",
      "Are you sure you want to request to WALK AWAY and take away all your points won till this question? The host must approve your request.",
      "info",
      async () => {
        if (submittingHotseat) return;
        try {
          setSubmittingHotseat(true);
          await hotseatWalkAway(id, session?.token);
          showBeautifulPopup("Request Sent", "Your request to walk away has been sent to the host. Please standby for approval.", "success");
        } catch (err) {
          showBeautifulPopup("Error", "Error while requesting walk away.", "error");
        } finally {
          setSubmittingHotseat(false);
        }
      },
      () => {},
      "Yes, Request Walk Away",
      "No, Keep Playing"
    );
  };

  // KBC Lifelines Activations
  const handleUse5050 = async () => {
    if (liveState?.hotseat_attempt?.lifeline_5050_used) return;
    if (!liveState?.hotseat_attempt?.options_visible) {
      showBeautifulPopup("Locked", "You can only request a lifeline after the choices are revealed by the host.", "warning");
      return;
    }
    if (liveState?.hotseat_attempt?.current_question_index >= 14) {
      showBeautifulPopup("Locked", "Lifelines are no longer available on the 15th question.", "warning");
      return;
    }
    try {
      await requestHotseatLifeline(id, '5050', '', session?.token);
      showBeautifulPopup("Lifeline Requested", "Your request for 50:50 Lifeline has been sent to the host.", "info");
    } catch (err) {
      showBeautifulPopup("Request Failed", err.message || "Failed to request 50:50 lifeline", "error");
    }
  };

  const handleUseAudiencePoll = async () => {
    if (liveState?.hotseat_attempt?.lifeline_poll_used) return;
    if (!liveState?.hotseat_attempt?.options_visible) {
      showBeautifulPopup("Locked", "You can only request a lifeline after the choices are revealed by the host.", "warning");
      return;
    }
    if (liveState?.hotseat_attempt?.current_question_index >= 14) {
      showBeautifulPopup("Locked", "Lifelines are no longer available on the 15th question.", "warning");
      return;
    }
    try {
      await requestHotseatLifeline(id, 'poll', '', session?.token);
      showBeautifulPopup("Lifeline Requested", "Your request for Audience Poll has been sent to the host.", "info");
    } catch (err) {
      showBeautifulPopup("Request Failed", err.message || "Failed to request Audience Poll", "error");
    }
  };

  const handleSpectatorVoteClick = async (choiceId) => {
    if (spectatorVotedChoiceId || submittingSpectatorVote || pollTimeLeft <= 0) return;
    try {
      setSubmittingSpectatorVote(true);
      await submitSpectatorVote(id, choiceId, session?.token);
      setSpectatorVotedChoiceId(choiceId);
      showBeautifulPopup("Vote Submitted!", "Your answer has been registered in the Audience Poll.", "success");
    } catch (err) {
      console.error("Failed to submit spectator vote:", err);
      showBeautifulPopup("Voting Failed", err.message || "Failed to submit spectator vote", "error");
    } finally {
      setSubmittingSpectatorVote(false);
    }
  };

  const handleUseSwitchQuestion = async () => {
    if (liveState?.hotseat_attempt?.lifeline_switch_used) return;
    if (!liveState?.hotseat_attempt?.options_visible) {
      showBeautifulPopup("Locked", "You can only request a lifeline after the choices are revealed by the host.", "warning");
      return;
    }
    if (liveState?.hotseat_attempt?.current_question_index >= 14) {
      showBeautifulPopup("Locked", "Lifelines are no longer available on the 15th question.", "warning");
      return;
    }
    try {
      await requestHotseatLifeline(id, 'switch', '', session?.token);
      showBeautifulPopup("Lifeline Requested", "Your request for Switch Question has been sent to the host.", "info");
    } catch (err) {
      showBeautifulPopup("Request Failed", err.message || "Failed to request Switch Question", "error");
    }
  };

  const handleConfirmSwitchCategory = async () => {
    if (!selectedCategoryId) {
      showBeautifulPopup("Selection Required", "Please click on a category card first.", "warning");
      return;
    }
    
    try {
      setSubmittingCategoryChoice(true);
      await selectHotseatSwitchCategory(id, selectedCategoryId, session?.token);
      
      setSelectedCategoryId(null);
      showBeautifulPopup("Domain Chosen!", "Transmitted selection to host. Awaiting host to trigger the question switch!", "success");
      
      await fetchLiveState();
    } catch (err) {
      showBeautifulPopup("Choice Failed", err.message || "Failed to select switch category.", "error");
    } finally {
      setSubmittingCategoryChoice(false);
    }
  };

  // ==========================================
  // VIEW RENDERS
  // ==========================================

  const handleExitArena = () => {
    showBeautifulPopup(
      "Exit Live Arena?",
      "Are you sure you want to EXIT the Live Arena? You will lose active connection and miss the current round.",
      "info",
      () => {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        navigate('/dashboard');
      },
      () => {},
      "Yes, Exit",
      "No, Stay"
    );
  };

  const renderTopbar = (title, badgeText = null, isTimer = false, timeLeftValue = 0, score = null) => {
    const timerWarning = timeLeftValue <= 10;
    const liveCount = liveState?.live_participants || 0;
    
    // For the regular (preliminary) round, display the total regular questions (liveState.total_questions).
    // Otherwise fallback to overall_total_questions or other metrics.
    const isRegular = liveState?.current_stage === 'regular';
    const totalQCount = isRegular
      ? (liveState?.total_questions || prelimTotal || 0)
      : (liveState?.overall_total_questions || liveState?.total_questions || prelimTotal || 0);

    const isHotseatContestant = liveState?.student_role === 'hotseat_player';
    const showExitButton = !isHotseatContestant || hotseatCompleted;

    return (
      <header className="arena-topbar">
        <div className="arena-brand">
          <span>{SYMBOLS.triangle}</span> {title}
        </div>
        
        {badgeText && <div className="event-badge">{badgeText}</div>}
        
        <div className="arena-header-stats">
          <div className="stat-badge glow-cyan">
            <span className="stat-icon">👥</span>
            <span className="stat-label">LIVE:</span>
            <strong className="stat-value">{liveCount}</strong>
          </div>
          
          {totalQCount > 0 && (
            <div className="stat-badge glow-pink">
              <span className="stat-icon">❓</span>
              <span className="stat-label">QUESTIONS:</span>
              <strong className="stat-value">{totalQCount}</strong>
            </div>
          )}

          {score !== null && (
            <div className="stat-badge glow-gold blinking-border animate-pulse" style={{
              border: '2px solid #ffd700',
              background: 'rgba(255, 215, 0, 0.08)',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px'
            }}>
              <span className="stat-icon">🏆</span>
              <span className="stat-label" style={{ color: '#ffd700', fontWeight: 'bold' }}>POINTS:</span>
              <strong className="stat-value" style={{ color: '#ffd700', fontWeight: '900' }}>{score} pts</strong>
            </div>
          )}
        </div>

        {isTimer && (
          <div className={`arena-timer ${timerWarning ? 'timer-warning' : ''}`}>
            <strong>00:{timeLeftValue < 10 ? `0${timeLeftValue}` : timeLeftValue}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {!isFullscreen && (
            <button 
              className="btn-fullscreen-toggle" 
              onClick={enterFullscreen} 
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1.2rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '900',
                fontSize: '0.85rem',
                boxShadow: '0 2px 10px rgba(255, 215, 0, 0.25)',
                fontFamily: 'monospace',
                letterSpacing: '0.05em'
              }}
            >
              📺 GO FULLSCREEN
            </button>
          )}
          {showExitButton && (
            <button className="btn-exit" onClick={handleExitArena}>
              🏃 EXIT ARENA
            </button>
          )}
        </div>
      </header>
    );
  };

  // Loading indicator
  if (loading) {
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-center">
          <div className="arena-loader">
            <span className="arena-spin-symbol">{SYMBOLS.triangle}</span>
            <h2 className="futuristic-text">Synchronizing Event Stream...</h2>
          </div>
        </div>
      </main>
    );
  }

  // 1. Role Selection Stage
  if (entryStage === 'role_selection') {
    const isTestingQuiz = liveState?.title?.toLowerCase().includes('test');
    const quizStarted = liveState && liveState.current_stage !== 'regular' && !isTestingQuiz;

    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
          <div className="arena-grid" />
        </div>
        <div className="arena-center">
          <div className="role-selection-panel glass-card glow-blue text-center animate-fade-in" style={{maxWidth: '800px', width: '100%'}}>
            <div className="kbc-crest">{SYMBOLS.triangle}</div>
            <h1 className="title-text golden-glow">WELCOME TO QUIZVERSE ARENA</h1>
            <p className="subtitle-text">Prepare your console for the premium live KBC experience</p>

            <div className="role-cards-container">
              {/* Participant Card */}
              <div 
                className={`role-selection-card participant-card glass-card ${quizStarted ? 'disabled' : 'clickable glow-pink'}`}
                onClick={!quizStarted ? handleSelectParticipant : undefined}
              >
                <div className="role-card-icon">⚔️</div>
                <h3>ENTER AS PARTICIPANT</h3>
                <p>Answer preliminary questions, compete for the leaderboard, and qualify for the hotseat!</p>
                {quizStarted ? (
                  <span className="badge-warning">Participant Entry Closed (Quiz in Progress)</span>
                ) : (
                  <span className="badge-action">COMPETE NOW ➡️</span>
                )}
              </div>

              {/* Spectator Card */}
              <div 
                className="role-selection-card spectator-card glass-card clickable glow-cyan"
                onClick={handleSelectSpectator}
              >
                <div className="role-card-icon">👁️</div>
                <h3>ENTER AS SPECTATOR</h3>
                <p>Watch the FFF sequence battles, spectate hotseat contestants, and track cash ladders in real-time.</p>
                <span className="badge-action text-cyan">JOIN TO WATCH ➡️</span>
              </div>

              {/* Host Card (Admins Only) */}
              {session?.user?.role === 'admin' && (
                <div 
                  className="role-selection-card host-card glass-card clickable glow-gold"
                  onClick={handleSelectHost}
                  style={{ border: '2px solid #ffd700', background: 'rgba(255, 215, 0, 0.03)' }}
                >
                  <div className="role-card-icon">🎙️</div>
                  <h3 style={{ color: '#ffd700' }}>ENTER AS HOST</h3>
                  <p>Command the Hotseat event, lock preselected contestant options, reveal correct answers, and read KBC trivia!</p>
                  <span className="badge-action text-gold" style={{ color: '#ffd700' }}>ENTER CONSOLE ➡️</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. Credentials Stage
  if (entryStage === 'credentials') {
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
          <div className="arena-grid" />
        </div>
        <div className="arena-center">
          <form className="arena-error-panel glass-card glow-blue animate-fade-in" onSubmit={handleVerifyAccessSubmit} style={{maxWidth: '500px', width: '100%'}}>
            <div className="kbc-crest">{SYMBOLS.triangle}</div>
            <h2 className="title-text golden-glow">KBC QUIZ ARENA ENTRY</h2>
            <p className="subtitle-text">Provide your Player ID and Event Password to enter the live arena</p>
            
            {verificationError && (
              <div className="error-alert">
                <span>{verificationError}</span>
              </div>
            )}

            <div className="input-group">
              <label>Player ID (e.g. PLAYER 001)</label>
              <input 
                type="text" 
                placeholder="Enter pre-assigned Player ID" 
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value.toUpperCase())}
                disabled={verifying}
              />
            </div>

            <div className="input-group">
              <label>Event Security Password</label>
              <input 
                type="password" 
                placeholder="Enter your unique arena password" 
                value={eventPassword}
                onChange={(e) => setEventPassword(e.target.value)}
                disabled={verifying}
              />
            </div>

            <button type="submit" className="btn-submit glow-button" disabled={verifying}>
              {verifying ? 'DECRYPTING ACCESS...' : 'VERIFY & CONTINUE'}
            </button>

            <button 
              type="button" 
              className="btn-back" 
              onClick={() => setEntryStage('role_selection')} 
              style={{marginTop: '1.5rem', background: 'transparent', border: 'none', color: 'var(--dash-muted)', cursor: 'pointer', textDecoration: 'underline'}}
            >
              ⬅️ Back to Selection
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 3. Instruction & Fullscreen Prep Stage
  if (entryStage === 'instructions') {
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
          <div className="arena-grid" />
        </div>
        <div className="arena-center">
          <div className="instruction-panel glass-card glow-pink animate-fade-in" style={{maxWidth: '650px', width: '100%'}}>
            <h2 className="title-text golden-glow text-center">⚔️ PARTICIPANT RULES & CONSOLE SETUP</h2>
            <p className="subtitle-text text-center">To ensure event integrity and synchronized gameplay, review the guidelines below:</p>

            <div className="instructions-list">
              <div className="checklist-item">
                <span className="check-bullet">🛡️</span>
                <div>
                  <h4>Strict Security Lock</h4>
                  <p>Tab switching, minimizing, or exiting full screen is prohibited during active gameplay. Exiting full screen will suspend your console.</p>
                </div>
              </div>

              <div className="checklist-item">
                <span className="check-bullet">⚡</span>
                <div>
                  <h4>Synchronized Rounds</h4>
                  <p>All participants face identical questions at the exact same time. Choice lock-ins are final once clicked.</p>
                </div>
              </div>

              <div className="checklist-item">
                <span className="check-bullet">💡</span>
                <div>
                  <h4>Trivia Explanations</h4>
                  <p>After locking your answer, read the educational trivia while waiting for the host to push the next question.</p>
                </div>
              </div>
            </div>

            <div className={`fullscreen-status-banner ${isFullscreen ? 'secured' : 'required'}`}>
              <span className="status-indicator-dot"></span>
              <strong>{isFullscreen ? 'FULLSCREEN SECURED 🟢' : 'FULLSCREEN REQUIRED 🔴'}</strong>
              <p>{isFullscreen ? 'Your console is locked and ready for synchronized play.' : 'You must open full screen mode before starting the quiz.'}</p>
            </div>

            <div className="instruction-actions" style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem'}}>
              {!isFullscreen && (
                <button className="btn-submit glow-button" onClick={enterFullscreen}>
                  GO FULL SCREEN 🚀
                </button>
              )}
              <button 
                className="btn-submit glow-button" 
                disabled={!isFullscreen} 
                onClick={() => {
                  setEntryStage('active');
                  setIsEntered(true);
                }}
                style={{
                  background: isFullscreen ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.05)',
                  color: isFullscreen ? '#030206' : 'rgba(255,255,255,0.2)',
                  cursor: isFullscreen ? 'pointer' : 'not-allowed'
                }}
              >
                CONTINUE TO QUIZ ➡️
              </button>
              
              <button 
                type="button" 
                className="btn-back" 
                onClick={() => {
                  setEntryStage('role_selection');
                  setUserSelectedRole(null);
                  setIsVerified(false);
                }}
                style={{background: 'transparent', border: 'none', color: 'var(--dash-muted)', cursor: 'pointer', textDecoration: 'underline'}}
              >
                ⬅️ Back to Selection
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fullscreen Required Guard (Only for active participants)
  if (isVerified && userSelectedRole === 'participant' && entryStage === 'active' && isEntered && !isFullscreen) {
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} locked-fullscreen`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
          <div className="arena-grid" />
        </div>
        <div className="arena-center">
          <div className="fullscreen-warning-card glass-card glow-red text-center animate-fade-in">
            <div className="lock-icon">⚠️</div>
            <h2 className="futuristic-text title-text">FULLSCREEN REQUIRED</h2>
            <p>To ensure event day security and KBC integrity, QuizVerse Arena must be played in full screen mode.</p>
            <p className="helper-text">Gameplay is suspended until full screen mode is restored.</p>
            <button className="btn-submit glow-button" onClick={enterFullscreen} style={{marginTop: '2rem'}}>
              RE-ENTER FULL SCREEN MODE 🚀
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Handle stage: Completed (Podium)
  if (liveState?.current_stage === 'completed') {
    const s1 = liveState.hotseat_score_1 || 0;
    const s2 = liveState.hotseat_score_2 || 0;
    const s3 = liveState.hotseat_score_3 || 0;
    const p1 = liveState.hotseat_player_1?.full_name || "Contestant 1";
    const p2 = liveState.hotseat_player_2?.full_name || "Contestant 2";
    const p3 = liveState.hotseat_player_3?.full_name || "Contestant 3";

    // Sort to determine 1st, 2nd, 3rd
    const podiumArr = [
      { name: p1, score: s1, batch: 1 },
      { name: p2, score: s2, batch: 2 },
      { name: p3, score: s3, batch: 3 }
    ].sort((a, b) => b.score - a.score);

    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
        </div>
        {renderTopbar("KBC Live Quiz Event Concluded", "CONCLUDED")}

        <div className="arena-center">
          <div className="podium-panel glass-card">
            <h1 className="podium-title golden-glow">CONGRATULATIONS CHAMPIONS!</h1>
            <p className="podium-subtitle">The battle has ended. Releasing official results.</p>

            <div className="podium-3d-container">
              {/* 2nd Place */}
              <div className="podium-col col-second">
                <div className="podium-avatar">{podiumArr[1]?.name[0]}</div>
                <div className="podium-name">{podiumArr[1]?.name}</div>
                <div className="podium-score">{podiumArr[1]?.score} pts</div>
                <div className="podium-block block-second">
                  <strong>2</strong>
                </div>
              </div>

              {/* 1st Place (Winner) */}
              <div className="podium-col col-first">
                <div className="winner-crown">👑</div>
                <div className="podium-avatar winner-glow">{podiumArr[0]?.name[0]}</div>
                <div className="podium-name">{podiumArr[0]?.name}</div>
                <div className="podium-score winner-text">{podiumArr[0]?.score} pts</div>
                <div className="podium-block block-first">
                  <strong>1</strong>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="podium-col col-third">
                <div className="podium-avatar">{podiumArr[2]?.name[0]}</div>
                <div className="podium-name">{podiumArr[2]?.name}</div>
                <div className="podium-score">{podiumArr[2]?.score} pts</div>
                <div className="podium-block block-third">
                  <strong>3</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle stage: batch_selection (Standby)
  if (liveState?.current_stage === 'batch_selection') {
    const b1 = liveState.batch_1_players || [];
    const b2 = liveState.batch_2_players || [];
    const b3 = liveState.batch_3_players || [];
    
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
        </div>
        {renderTopbar("Preliminary Completed", "STAGE: SELECTION")}

        <div className="arena-container">
          <div className="glass-card panel-intro text-center">
            <h2 className="golden-glow">Leaderboard Finalized!</h2>
            <p>Admin has compiled the top preliminary scorers and arranged them into three equal batches of {b1.length || 0} for the FFF round!</p>
          </div>

          <div className="batches-grid">
            <div className="batch-column glass-card border-gold">
              <h3>BATCH 1 (Contestants 1-{b1.length})</h3>
              <p className="helper-text">Competes in FFF Batch 1</p>
              <ul>
                {b1.length === 0 ? <li className="empty-li">Locking players...</li> : b1.map((player, idx) => {
                  const pId = player?.id;
                  const pName = player?.name || `Player ID: ${pId}`;
                  const isYou = session?.user?.id === pId;
                  return (
                    <li key={pId || idx} className={isYou ? 'user-highlight' : ''}>
                      <span>#{idx+1} {pName}</span>
                      {isYou && <span className="you-pill">YOU</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="batch-column glass-card border-gold">
              <h3>BATCH 2 (Contestants {b1.length + 1}-{b1.length + b2.length})</h3>
              <p className="helper-text">Competes in FFF Batch 2</p>
              <ul>
                {b2.length === 0 ? <li className="empty-li">Locking players...</li> : b2.map((player, idx) => {
                  const pId = player?.id;
                  const pName = player?.name || `Player ID: ${pId}`;
                  const isYou = session?.user?.id === pId;
                  return (
                    <li key={pId || idx} className={isYou ? 'user-highlight' : ''}>
                      <span>#{idx + b1.length + 1} {pName}</span>
                      {isYou && <span className="you-pill">YOU</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="batch-column glass-card border-gold">
              <h3>BATCH 3 (Contestants {b1.length + b2.length + 1}-{b1.length + b2.length + b3.length})</h3>
              <p className="helper-text">Competes in FFF Batch 3</p>
              <ul>
                {b3.length === 0 ? <li className="empty-li">Locking players...</li> : b3.map((player, idx) => {
                  const pId = player?.id;
                  const pName = player?.name || `Player ID: ${pId}`;
                  const isYou = session?.user?.id === pId;
                  return (
                    <li key={pId || idx} className={isYou ? 'user-highlight' : ''}>
                      <span>#{idx + b1.length + b2.length + 1} {pName}</span>
                      {isYou && <span className="you-pill">YOU</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle stage: Preliminary Quiz (regular)
  if (liveState?.current_stage === 'regular') {
    if (userSelectedRole === 'spectator' || userSelectedRole === 'host') {
      const isHost = userSelectedRole === 'host';
      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar(isHost ? "Hosting Preliminary Quiz" : "Spectating Preliminary Quiz", isHost ? "HOST" : "SPECTATOR")}
          <div className="arena-center">
            <div className="arena-completed-panel glass-card text-center glow-blue" style={{maxWidth: '600px'}}>
              <div className="lock-icon">👁️</div>
              <h2 className="title-text golden-glow font-bold">{isHost ? "HOSTING PRELIMINARY ROUND" : "SPECTATING PRELIMINARY ROUND"}</h2>
              <p style={{margin: '1.5rem 0', fontSize: '1.1rem'}}>Participants are currently answering synchronized preliminary questions.</p>
              <p className="helper-text">{isHost ? "Manage the arena from your Live KBC Controller." : "Standby. The host will compute the leaderboard and reveal batch selections soon!"}</p>
            </div>
          </div>
        </main>
      );
    }

    // Check if the quiz is live yet (standby view for participant)
    if (liveState?.status !== 'live') {
      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar("Standby Mode", "ARENA ENTRY")}
          <div className="arena-center">
            <div className="arena-completed-panel glass-card text-center glow-blue" style={{maxWidth: '600px'}}>
              <div className="lock-icon" style={{ animation: 'spin 4s linear infinite', display: 'inline-block' }}>⏳</div>
              <h2 className="title-text golden-glow font-bold">WAITING FOR THE HOST</h2>
              <p style={{margin: '1.5rem 0', fontSize: '1.1rem'}}>The arena is secured. The host has not started the live event yet.</p>
              <p className="helper-text">Standby. Your screen will automatically load the questions as soon as the host goes live!</p>
            </div>
          </div>
        </main>
      );
    }

    if (!prelimQuestion) {
      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-center">
            <div className="arena-completed-panel glass-card">
              <span className="arena-status">Preliminary Completed</span>
              <h2 className="title-text golden-glow">Preliminary Answers Locked</h2>
              <p>You have successfully submitted all your responses. Standby for the admin to compute the leaderboard!</p>
            </div>
          </div>
        </main>
      );
    }

    const timerWarning = prelimTimeLeft <= 10;
    const progressPercent = prelimTotal > 0 ? ((prelimIndex + 1) / prelimTotal) * 100 : 0;

    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
        </div>
        {renderTopbar("Preliminary Quiz", "PRELIMINARY", !prelimFeedback, prelimTimeLeft)}

        <section className="arena-container">
          <div className="arena-progress-bar">
            <div className="arena-progress-fill" style={{width: `${progressPercent}%`}} />
          </div>

          <div className="arena-header-row">
            <span>Question {prelimIndex + 1} of {prelimTotal}</span>
          </div>

          {prelimFeedback ? (
            <div className="trivia-card glass-card glow-blue animate-fade-in">
              <div className="trivia-header-row">
                <span className={`trivia-grade-badge ${prelimFeedback.correct ? 'correct' : 'incorrect'}`}>
                  {prelimFeedback.correct ? 'CORRECT! 🚀' : 'INCORRECT ❌'}
                </span>
                <span className="trivia-category">Category: {prelimFeedback.questionCategory}</span>
              </div>
              
              <div className="trivia-question-summary">
                <h3>{prelimFeedback.questionText}</h3>
                <div className="trivia-answer-check">
                  <span className="label">Correct Answer:</span>
                  <strong className="correct-value">{prelimFeedback.correct_choice?.text || 'N/A'}</strong>
                </div>
              </div>

              {prelimFeedback.trivia ? (
                <div className="trivia-fact-box">
                  <h4>💡 DID YOU KNOW? (TRIVIA)</h4>
                  <p>{prelimFeedback.trivia}</p>
                </div>
              ) : (
                <div className="trivia-fact-box">
                  <h4>💡 ANSWER EXPLANATION</h4>
                  <p>Keep going! Great job testing your intelligence in the QuizVerse Arena.</p>
                </div>
              )}

              <div className="trivia-actions" style={{ marginTop: '2rem' }}>
                <button className="btn-submit glow-button" onClick={handleProceedFromTrivia}>
                  PROCEED TO NEXT QUESTION 🚀
                </button>
              </div>
            </div>
          ) : (
            <>
              <article className="arena-question-card glass-card">
                <h2>{prelimQuestion.text}</h2>
              </article>

              <div className="arena-choices-grid">
                {prelimQuestion.choices?.map((choice, i) => (
                  <button 
                    key={choice.id}
                    className={`arena-choice-btn ${prelimSelected === choice.id ? 'selected' : ''}`}
                    onClick={() => setPrelimSelected(choice.id)}
                    disabled={prelimSubmitting}
                  >
                    <div className="choice-indicator">{['A','B','C','D'][i]}</div>
                    <div className="choice-text">{choice.text}</div>
                  </button>
                ))}
              </div>

              <div className="arena-actions">
                <button 
                  className="btn-submit glow-button" 
                  onClick={() => submitPrelimAnswer(prelimSelected)}
                  disabled={prelimSubmitting}
                >
                  {prelimSubmitting ? 'TRANSMITTING...' : 'CONFIRM & LOCK'}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  // Handle stage: Buzzer Round
  const isBuzzerStage = liveState?.current_stage === 'buzzer_round';
  if (isBuzzerStage) {
    const isSpectatorOrHost = userSelectedRole === 'spectator' || userSelectedRole === 'host';
    
    if (isSpectatorOrHost) {
      const bState = liveState.buzzer_state || {};
      const activeQuestion = bState.current_question;
      const mapping = bState.buzzer_mappings || {};
      
      const limit = bState.answer_timer_limit || 15;
      const timerPercent = (buzzerTimeRemaining / limit) * 100;
      const radius = 50;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (timerPercent / 100) * circumference;

      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar("🚨 BUZZER ROUND", "SPECTATOR DISPLAY")}

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', padding: '1rem 3rem', height: 'calc(100vh - 120px)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
              {activeQuestion ? (
                <>
                  <div className="glass-card text-center" style={{ padding: '3rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '0.9rem', color: '#ffb300', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {activeQuestion.category} • {activeQuestion.marks} Marks
                    </span>
                    <h2 className="title-text golden-glow font-bold" style={{ fontSize: '2.4rem', marginTop: '1rem', lineHeight: '1.3' }}>
                      {activeQuestion.text}
                    </h2>
                  </div>

                  {bState.options_visible ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                      {bState.choices?.map((choice, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const isCorrect = choice.id === bState.correct_choice_id;
                        const showCorrect = bState.answer_visible;
                        
                        return (
                          <div 
                            key={choice.id} 
                            className={`kbc-option-container glass-card ${showCorrect && isCorrect ? 'correct-glow' : ''}`}
                            style={{ 
                              padding: '1.5rem', 
                              borderRadius: '10px', 
                              fontSize: '1.35rem', 
                              color: showCorrect && isCorrect ? '#10b981' : 'white',
                              border: showCorrect && isCorrect ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              background: showCorrect && isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.3)',
                              transition: 'all 0.5s ease'
                            }}
                          >
                            <span style={{ color: showCorrect && isCorrect ? '#10b981' : 'var(--kbc-sky)', fontWeight: 'bold' }}>{letter}:</span>
                            <span>{choice.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass-card text-center" style={{ padding: '2rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '1.2rem' }}>
                      Options are locked by Host. Awaiting reveal...
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '1rem', height: '180px' }}>
                    {bState.active_buzzer_id ? (
                      <div className="pulse-glow-red" style={{ background: 'rgba(244,63,94,0.1)', border: '2px solid #f43f5e', borderRadius: '12px', padding: '1.5rem 3rem', display: 'flex', alignItems: 'center', gap: '3rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', color: '#f43f5e', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>BUZZED! ACTIVE TURN</div>
                          <h3 style={{ fontSize: '1.8rem', color: 'white', margin: '0.3rem 0' }}>Answering in Progress...</h3>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.5rem', color: 'var(--kbc-sky)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', animation: 'pulse 1.5s infinite ease-in-out' }}>
                        🚨 Buzzers Active! PRESS NOW!
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
                  <h2 className="title-text golden-glow">Buzzer Round</h2>
                  <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Standby... The Host will present the questions shortly.</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'gold', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'center' }}>
                🏆 Scoreboard
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', flex: 1 }}>
                {Object.entries(mapping)
                  .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
                  .map(([bId, details], rank) => {
                    const isTop = rank === 0;
                    return (
                      <div 
                        key={bId} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: isTop ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)', 
                          border: isTop ? '1px solid gold' : '1px solid rgba(255,255,255,0.05)', 
                          padding: '0.8rem 1rem', 
                          borderRadius: '8px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 'bold', color: isTop ? 'gold' : 'rgba(255,255,255,0.4)' }}>#{rank + 1}</span>
                          <span style={{ fontWeight: 'bold', color: isTop ? 'white' : 'rgba(255,255,255,0.8)' }}>
                            {details.name}
                          </span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'gold' }}>
                          {details.score || 0} pts
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        </main>
      );
    } else {
      const bState = liveState.buzzer_state || {};
      const isBlocked = bState.incorrect_buzzers?.includes(buzzerPressId);
      const amIActiveTurn = bState.active_buzzer_id === buzzerPressId && buzzerPressId !== '';

      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar("🚨 LIVE BUZZER PODIUM", "PARTICIPANT PORTAL")}

          <div className="arena-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '1rem 2rem' }}>
            
            {!buzzerPressId ? (
              <div className="glass-card text-center glow-pink" style={{ padding: '2.5rem', borderRadius: '16px', maxWidth: '450px', width: '100%' }}>
                <h3 className="title-text golden-glow font-bold" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Podium Setup</h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                  Select your Podium / Buzzer number (1 to 15) to connect this screen.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setBuzzerPressId(String(num))}
                      style={{
                        padding: '0.6rem 0',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--kbc-sky)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '500px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    <strong style={{ fontSize: '0.9rem' }}>Buzzer #{buzzerPressId}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      ({bState.buzzer_mappings?.[buzzerPressId]?.name || 'Unmapped'})
                    </span>
                  </div>
                  <button 
                    onClick={() => { setBuzzerPressId(''); setBuzzerError(''); setBuzzerSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Disconnect
                  </button>
                </div>

                {buzzerError && <div className="glass-card" style={{ width: '100%', background: 'rgba(244,63,94,0.12)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '0.8rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem' }}>{buzzerError}</div>}
                {buzzerSuccess && <div className="glass-card" style={{ width: '100%', background: 'rgba(16,185,129,0.12)', border: '1px solid #10b981', color: '#10b981', padding: '0.8rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem' }}>{buzzerSuccess}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                  
                  {isBlocked ? (
                    <div className="glass-card text-center" style={{ padding: '3rem 2rem', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.1)' }}>
                      <span style={{ fontSize: '3rem' }}>🚫</span>
                      <h3 style={{ color: '#ef4444', margin: '0.8rem 0 0 0', fontWeight: 'bold' }}>EXCLUDED</h3>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Your team answered incorrectly on this question.</p>
                    </div>
                  ) : amIActiveTurn ? (
                    <div className="glass-card text-center pulse-glow-red" style={{ padding: '3.5rem 2rem', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.1)' }}>
                      <span style={{ fontSize: '3.5rem' }}>🎤</span>
                      <h3 style={{ color: '#ffcc00', margin: '0.8rem 0 0 0', fontWeight: 'bold', fontSize: '1.6rem' }}>YOUR TURN TO ANSWER!</h3>
                      <p style={{ color: 'white', fontSize: '0.9rem', marginTop: '0.5rem' }}>Present your answer to the host.</p>
                    </div>
                  ) : (() => {
                    const hasAlreadyBuzzed = bState.presses?.some(p => String(p.buzzer_id) === String(buzzerPressId));
                    return (
                      <>
                        <button
                          disabled={hasAlreadyBuzzed || isBuzzingLocal}
                          onClick={() => handleBuzzerClick(buzzerPressId)}
                          style={{
                            width: '240px',
                            height: '240px',
                            borderRadius: '50%',
                            background: hasAlreadyBuzzed
                              ? 'radial-gradient(circle, #2e7d32 0%, #1b5e20 100%)'
                              : 'radial-gradient(circle, #ff2a4b 0%, #b3001e 100%)',
                            border: hasAlreadyBuzzed
                              ? '10px solid #4caf50'
                              : '10px solid #ff6b81',
                            boxShadow: hasAlreadyBuzzed
                              ? '0 0 35px rgba(76, 175, 80, 0.8), inset 0 0 20px rgba(255,255,255,0.4)'
                              : '0 0 35px rgba(255, 42, 75, 0.8), inset 0 0 20px rgba(255,255,255,0.4)',
                            color: 'white',
                            fontSize: '2rem',
                            fontWeight: '900',
                            letterSpacing: '0.05em',
                            cursor: hasAlreadyBuzzed ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <span>{hasAlreadyBuzzed ? '✔️' : '🚨'}</span>
                          <span>{hasAlreadyBuzzed ? 'BUZZED' : 'BUZZ'}</span>
                        </button>

                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', textAlign: 'center' }}>
                          {hasAlreadyBuzzed 
                            ? 'Your press is registered. Wait for the host to review.' 
                            : 'Buzzers are active! Click the big button to buzz in!'}
                        </div>
                      </>
                    );
                  })()}

                </div>

              </div>
            )}

          </div>
        </main>
      );
    }
  }

  // Handle stage: Fastest Finger First (fff_batch_1, fff_batch_2, fff_batch_3)
  const isFffStage = liveState?.current_stage.startsWith('fff_batch_');
  if (isFffStage) {
    const fffBatch = liveState.current_stage.slice(-1);
    
    // Check if the user is in the active batch
    if (!liveState.is_in_active_batch) {
      // Spectator view for FFF
      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar(`Spectating FFF Batch ${fffBatch}`, "SPECTATOR")}

          <div className="arena-center" style={{ marginTop: '2rem' }}>
            <div className="arena-completed-panel glass-card text-center glow-pink" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="lock-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h2 className="title-text golden-glow font-bold">Fastest Finger First In Progress</h2>
              <p style={{ margin: '1.5rem 0', fontSize: '1.1rem' }}>
                Batch {fffBatch} contenders are currently competing in the FFF round to win a spot on the Hotseat!
              </p>
              <p className="helper-text" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                For security and fairness, FFF questions are hidden from spectators. Standby for the Host to promote the winner and start the Hotseat show!
              </p>
            </div>
          </div>
        </main>
      );
    }

    // Player view for FFF
    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
        </div>
        {renderTopbar(`FASTEST FINGER FIRST (BATCH ${fffBatch})`, "FFF CONTENDER", true, fffTimeLeft)}

        <section className="arena-container">
          {fffAnswered ? (
            <div className="arena-center">
              <div className="glass-card text-center glow-blue" style={{maxWidth: '500px', padding: '3rem'}}>
                <div className="lock-icon">🔒</div>
                <h2 className="golden-glow">ANSWER SECURED</h2>
                <p>Your arrangement sequence was transmitted in <strong className="winner-text">{fffTimeTaken}s</strong>!</p>
                <p className="helper-text">Stay tuned. Admin will display the speed standings once all contestants have completed.</p>
              </div>
            </div>
          ) : liveState.fff_question ? (
            <>
              <div className="glass-card panel-intro text-center">
                <h3 className="winner-text">ACCURACY & SPEED MATTERS!</h3>
                <p>Click the options in the correct sequence order from 1 to {liveState.fff_question.choices.length}. Click again to remove.</p>
              </div>

              <article className="arena-question-card glass-card glow-pink">
                <h2>{liveState.fff_question.text}</h2>
              </article>

              <div className="arena-choices-grid">
                {liveState.fff_question.choices.map((choice, i) => {
                  const seqIndex = fffSelectedSequence.indexOf(choice.id);
                  const isSelected = seqIndex !== -1;
                  return (
                    <button 
                      key={choice.id}
                      className={`arena-choice-btn fff-btn glow-glow ${isSelected ? 'fff-selected-kbc' : ''}`}
                      onClick={() => handleFFFChoiceClick(choice.id)}
                    >
                      <div className="choice-indicator">
                        {isSelected ? (
                          <span className="fff-order-badge">{seqIndex + 1}</span>
                        ) : (
                          ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'][i] || i + 1
                        )}
                      </div>
                      <div className="choice-text">{choice.text}</div>
                    </button>
                  );
                })}
              </div>

              <div className="fff-controls-row" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button
                  type="button"
                  className="prelim-reset-btn"
                  onClick={handleResetFFFSequence}
                  disabled={fffSelectedSequence.length === 0}
                  style={{
                    background: 'rgba(255, 100, 100, 0.12)',
                    borderColor: 'rgba(255, 100, 100, 0.4)',
                    color: 'rgb(255, 150, 150)',
                    padding: '0.8rem 2rem',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontWeight: '900',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  RESET ARRANGEMENT
                </button>
                
                <button
                  type="button"
                  className="enter-arena-btn-card"
                  onClick={handleFFFSubmit}
                  disabled={fffSelectedSequence.length !== liveState.fff_question.choices.length}
                  style={{
                    padding: '0.8rem 3rem',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontWeight: '900',
                    letterSpacing: '0.1em',
                    cursor: fffSelectedSequence.length === liveState.fff_question.choices.length ? 'pointer' : 'not-allowed',
                    opacity: fffSelectedSequence.length === liveState.fff_question.choices.length ? 1 : 0.45
                  }}
                >
                  LOCK IN ARRANGEMENT &rarr;
                </button>
              </div>
            </>
          ) : (
            <div className="arena-center">
              <h2>Preparing FFF terminal...</h2>
            </div>
          )}
        </section>
      </main>
    );
  }

  // Handle stage: Hotseat (hotseat_batch_1, hotseat_batch_2, hotseat_batch_3)
  const isHotseatStage = liveState?.current_stage.startsWith('hotseat_batch_');
  if (isHotseatStage) {
    const introContestantName = hostHotseatData?.contestant_name || liveState?.hotseat_attempt?.player_name;
    const introComponent = showHotseatIntro ? (
      <HotseatIntro 
        onTransitionStart={() => {
          setPoweringOn(true);
          setTimeout(() => setPoweringOn(false), 4000);
        }}
        onComplete={() => {
          setShowHotseatIntro(false);
          setHasSeenHotseatIntro(true);
        }} 
        contestantName={introContestantName} 
        introTitle={liveState?.intro_title}
      />
    ) : null;

    const activeBatch = liveState.current_stage.slice(-1);
    
    // View if user is hosting in Amitabh Bachchan Mode
    if (userSelectedRole === 'host') {
      const activeContestantName = hostHotseatData?.contestant_name || `Contestant`;
      const currentContestantScore = hostHotseatData?.score || 0;
      const progressLevel = hostHotseatData?.current_index || 0;

      if (hostHotseatData?.completed) {
        const hsStatus = hostHotseatData.status;
        const hsScore = hostHotseatData.score;
        let endReason = "Incorrect Answer! Dropped to the nearest safety checkpoint.";
        if (hsStatus === 'walked_away') {
          endReason = "Contestant Walked Away! Safely secured their accumulated points.";
        } else if (hsStatus === 'completed') {
          endReason = "Amazing! The contestant has successfully conquered the entire question ladder!";
        } else if (hsStatus === 'timeout') {
          endReason = "Time Out! Contestant ran out of time.";
        }

        return (
          <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
            <div className="arena-background">
              <KbcStageFx intensity="lite" />
              <div className="arena-orb orb-pink" />
              <div className="arena-orb orb-cyan" />
            </div>
            {renderTopbar(`🎙️ LIVE HOTSEAT SHOW: CONCLUDED`, "HOST CONSOLE", false, 0, hsScore)}
            <div className="arena-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
              <div className="arena-completed-panel glass-card text-center glow-pink" style={{ maxWidth: '600px', width: '90%', padding: '4rem 2rem' }}>
                <span className="arena-status" style={{ background: '#db2777', color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HOTSEAT CONCLUDED</span>
                <h2 className="golden-glow" style={{ fontSize: '2.5rem', margin: '1rem 0 1.5rem 0', fontWeight: '900' }}>{activeContestantName}'s GAME ENDED</h2>
                <div className="arena-score-display" style={{ margin: '2rem 0' }}>
                  <span className="score-kicker" style={{ display: 'block', fontSize: '1rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONTESTANT FINAL SCORE</span>
                  <strong style={{ fontSize: '4.5rem', color: '#ffd700', textShadow: '0 0 15px rgba(255,215,0,0.5)' }}>{hsScore} pts</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Reason for Ending</span>
                  <p style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 'bold' }}>{endReason}</p>
                </div>
                <p style={{ color: '#94a3b8' }}>Please advance the event phase in the Admin Dashboard to proceed to the next round.</p>
              </div>
            </div>
          </main>
        );
      }

      const correctChoice = hostHotseatData?.question?.choices?.find(c => c.is_correct);
      const correctChoiceIndicator = correctChoice ? ['A','B','C','D'][hostHotseatData.question.choices.indexOf(correctChoice)] : '';

      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
          {showLocalTestIntro ? (
            <HotseatIntro 
              onTransitionStart={() => {
                setPoweringOn(true);
                setTimeout(() => setPoweringOn(false), 4000);
              }}
              onComplete={() => {
                setShowLocalTestIntro(false);
              }}
              contestantName={activeContestantName || "TEST CONTENDER"}
              introTitle={liveState?.intro_title}
            />
          ) : introComponent}
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar(`🎙️ LIVE HOTSEAT SHOW: HOST MODE`, "HOST CONSOLE", false, 0, currentContestantScore)}

          <div className="hotseat-layout">
            {/* Left Panel: Active replica board with host controls */}
            <div className="hotseat-console-panel">
              {/* Display Screen */}
              <div className="active-question-section">
                
                {/* Switch Category Selection & Switch Trigger Card for Host */}
                {hostHotseatData?.pending_lifeline_type === 'switch' && hostHotseatData?.lifeline_request_status === 'approved' && (
                  <div className="lifeline-request-alert glass-card glow-pink blinking-border" style={{
                    padding: '1.5rem',
                    borderRadius: '10px',
                    background: 'rgba(219, 39, 119, 0.05)',
                    border: '2px dashed #db2777',
                    marginBottom: '1.25rem',
                    textAlign: 'center',
                    boxShadow: '0 0 20px rgba(219, 39, 119, 0.2)'
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#db2777', fontSize: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: '900' }}>
                      🔄 SWITCH LIFELINE CONTROL
                    </h3>
                    
                    {(() => {
                      const selectedCatStr = hostHotseatData.pending_lifeline_switch_category;
                      const hasChosen = selectedCatStr && selectedCatStr.includes(':');
                      const chosenName = hasChosen ? selectedCatStr.split(':', 2)[1] : '';

                      if (!hasChosen) {
                        return (
                          <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#fff' }}>
                              Contestant <strong style={{ color: '#db2777' }}>{activeContestantName}</strong> is currently reviewing domains...
                            </p>
                            <div className="loading-spinner-hourglass" style={{ fontSize: '2rem', animation: 'spin 2s linear infinite', color: '#db2777' }}>⏳</div>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff', lineHeight: '1.5' }}>
                            Contestant selected domain: <strong style={{ color: 'var(--dash-gold-bright)', textShadow: '0 0 10px rgba(212,175,55,0.4)', textTransform: 'uppercase' }}>{chosenName}</strong>
                          </p>
                          <button 
                            onClick={handleHostConfirmSwitch} 
                            disabled={confirmingSwitch}
                            style={{
                              background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
                              color: '#000',
                              fontWeight: '900',
                              padding: '0.65rem 2.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                              letterSpacing: '0.05em',
                              fontSize: '0.95rem',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.6)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.4)'; }}
                          >
                            {confirmingSwitch ? 'SWITCHING QUESTION...' : '⚡ TRIGGER QUESTION SWITCH'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Lifeline Request Notification Card */}
                {hostHotseatData?.lifeline_request_status === 'requested' && (
                  <div 
                    className="lifeline-request-alert glass-card blinking-border animate-pulse" 
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      background: hostHotseatData.pending_lifeline_type === 'walkaway' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(255, 215, 0, 0.06)',
                      border: hostHotseatData.pending_lifeline_type === 'walkaway' ? '2px solid #f44336' : '2px solid #ffd700',
                      boxShadow: hostHotseatData.pending_lifeline_type === 'walkaway' ? '0 0 20px rgba(244, 67, 54, 0.3)' : '0 0 20px rgba(255, 215, 0, 0.25)',
                      marginBottom: '1.25rem',
                      textAlign: 'center',
                    }}
                  >
                    {hostHotseatData.pending_lifeline_type === 'walkaway' ? (
                      <>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#f44336', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: '900' }}>
                          🛑 CONTESTANT WANTS TO WALK AWAY!
                        </h3>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#fff', lineHeight: '1.4' }}>
                          Contestant <strong style={{ color: '#ffd700' }}>{activeContestantName}</strong> wants to quit at this question and walk away with all points won till now: <strong style={{ color: '#ffd700', fontSize: '1.2rem' }}>{formatPoints(currentContestantScore)} pts</strong>.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffd700', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: '900' }}>
                          🛎️ LIFELINE REQUEST PENDING
                        </h3>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#fff', lineHeight: '1.4' }}>
                          Contestant <strong style={{ color: '#ffd700' }}>{activeContestantName}</strong> wants to activate the <strong style={{ color: '#ffd700', textTransform: 'uppercase', textShadow: '0 0 5px rgba(255,215,0,0.5)' }}>{hostHotseatData.pending_lifeline_type === '5050' ? '50:50' : hostHotseatData.pending_lifeline_type === 'poll' ? 'Audience Poll' : `Switch Question (${hostHotseatData.pending_lifeline_switch_category})`}</strong> lifeline.
                        </p>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                      <button 
                        onClick={handleApproveLifeline} 
                        disabled={approvingLifeline}
                        style={{
                          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                          color: '#fff',
                          fontWeight: '900',
                          padding: '0.5rem 2.2rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)',
                          letterSpacing: '0.05em',
                          fontSize: '0.9rem'
                        }}
                      >
                        {approvingLifeline ? 'APPROVING...' : '✅ APPROVE'}
                      </button>

                      <button 
                        onClick={handleRejectLifeline} 
                        disabled={rejectingLifeline}
                        style={{
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: '#fff',
                          fontWeight: '900',
                          padding: '0.5rem 2.2rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(244, 67, 54, 0.3)',
                          letterSpacing: '0.05em',
                          fontSize: '0.9rem'
                        }}
                      >
                        {rejectingLifeline ? 'REJECTING...' : '❌ REJECT'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="glass-card panel-intro text-center glow-gold" style={{ border: '1px solid #ffd700', background: 'rgba(255, 215, 0, 0.02)' }}>
                  <h3>Contestant: <strong className="winner-text">{activeContestantName}</strong></h3>
                  <p>Current Score: <strong className="winner-text">{currentContestantScore} pts</strong></p>
                </div>

                {hostHotseatData?.active && hostHotseatData?.question ? (
                  <>
                    <span className="question-category-tag">CATEGORY: {hostHotseatData.question.category || 'General'}</span>
                    <article className="arena-question-card glass-card kbc-question-frame" style={{ border: '2px solid rgba(255, 215, 0, 0.25)', background: 'rgba(255, 215, 0, 0.01)' }}>
                      <h2>{hostHotseatData.question.text}</h2>
                    </article>

                    <div className="kbc-choices-grid">
                      {hostHotseatData.question.choices.map((choice, i) => {
                        const isPreselected = hostHotseatData.preselected_choice_id === choice.id;
                        const hostEliminatedIds = hostHotseatData?.approved_lifeline_data?.eliminated_choice_ids || [];
                        const isChoiceEliminated = hostEliminatedIds.includes(choice.id);

                        return (
                          <div 
                            key={choice.id}
                            className={`arena-choice-btn kbc-choice disabled ${isPreselected ? 'selected' : ''} ${isChoiceEliminated ? 'eliminated' : ''}`}
                            style={{
                              border: isPreselected ? '2px solid #ff9800' : '1px solid var(--admin-border)',
                              background: isPreselected ? 'rgba(255, 152, 0, 0.1)' : 'rgba(0,0,0,0.2)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              opacity: isChoiceEliminated ? 0.25 : 1,
                              pointerEvents: isChoiceEliminated ? 'none' : 'auto'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="choice-indicator">{['A','B','C','D'][i]}</div>
                              <div className="choice-text">{isChoiceEliminated ? "" : choice.text}</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {isPreselected && (
                                <span className="blinking" style={{ background: '#ff9800', color: '#000', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                                  PLAYER SELECTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Real-time Host Audience Poll Display */}
                    {hostHotseatData?.pending_lifeline_type === 'poll' && 
                     hostHotseatData?.lifeline_request_status === 'approved' && (
                      <div className="glass-card glow-cyan text-center animate-fade-in" style={{ padding: '1.5rem', margin: '2rem 0', background: 'rgba(33, 211, 238, 0.03)', border: '1px solid rgba(33, 211, 238, 0.25)', borderRadius: '12px' }}>
                        <span className="golden-glow" style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                          🗳️ AUDIENCE POLL LIVE FEED (HOST VIEW)
                        </span>
                        <p style={{ margin: '0 0 1.5rem 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                          {pollTimeLeft > 0 
                            ? `Spectators are voting... (${pollTimeLeft}s remaining)` 
                            : 'Voting concluded and results finalized.'
                          }
                        </p>
                        
                        <div className="poll-chart-container" style={{ margin: '0 auto', maxWidth: '450px' }}>
                          {hostHotseatData.question.choices.map((choice, i) => {
                            const displayVotes = hostHotseatData.approved_lifeline_data?.votes || {};
                            const percentage = displayVotes[choice.id] || 0;
                            const isHighest = percentage > 0 && percentage === Math.max(...Object.values(displayVotes));
                            return (
                              <div key={choice.id} className="poll-bar-col">
                                <div className="poll-bar-wrapper">
                                  <div
                                    className={`poll-bar-fill ${isHighest ? 'poll-bar-winner' : ''}`}
                                    style={{
                                      height: `${percentage}%`,
                                      transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                      background: isHighest ? 'linear-gradient(180deg, #ffd700, #ff8c00)' : undefined
                                    }}
                                  >
                                    <span className="poll-pct">{percentage}%</span>
                                  </div>
                                </div>
                                <div className="poll-bar-label" style={{ fontWeight: isHighest ? '900' : '600', color: isHighest ? '#ffd700' : undefined }}>
                                  {['A','B','C','D'][i]}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cinematic Pacing Controller Panel */}
                    <div className="glass-card" style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--admin-border)',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '10px',
                      marginTop: '2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 0.2rem 0', color: '#ffd700', fontSize: '1rem', fontWeight: 'bold' }}>
                          🎬 PACING SYSTEM CONTROLS
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          Manage choices reveal and manual countdown holds in real-time.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        {/* Play/Stop Intro Button */}
                        {(!hostHotseatData?.intro_played || hostHotseatData?.show_intro) && (
                          <button
                            onClick={hostHotseatData.show_intro ? handleHostCompleteIntro : handleHostTriggerIntro}
                            style={{
                              background: hostHotseatData.show_intro 
                                ? 'linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%)'
                                : 'linear-gradient(135deg, #00bfff 0%, #0080ff 100%)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: '900',
                              padding: '0.6rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: hostHotseatData.show_intro 
                                ? '0 2px 10px rgba(255, 77, 77, 0.25)' 
                                : '0 2px 10px rgba(0, 191, 255, 0.25)',
                              textTransform: 'uppercase',
                              fontSize: '0.85rem'
                            }}
                          >
                            {hostHotseatData.show_intro ? '⏹️ STOP INTRO' : '🎥 PLAY INTRO'}
                          </button>
                        )}

                        {/* Next Question Push Button */}
                        {!hostHotseatData.showing_question && (
                          <button
                            onClick={handleHostNextQuestion}
                            style={{
                              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: '900',
                              padding: '0.6rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 10px rgba(76, 175, 80, 0.25)',
                              textTransform: 'uppercase',
                              fontSize: '0.85rem'
                            }}
                          >
                            ➡️ PUSH NEXT QUESTION
                          </button>
                        )}

                        {/* Show Options Button */}
                        {hostHotseatData.showing_question && !hostHotseatData.options_visible && (
                          <button
                            onClick={handleHostShowOptions}
                            style={{
                              background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: '900',
                              padding: '0.6rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 10px rgba(0, 188, 212, 0.25)',
                              textTransform: 'uppercase',
                              fontSize: '0.85rem'
                            }}
                          >
                            👁️ SHOW OPTIONS
                          </button>
                        )}

                        {/* Timer Control Buttons */}
                        {hostHotseatData.showing_question && hostHotseatData.options_visible && (
                          <button
                            onClick={hostHotseatData.timer_is_paused ? handleHostResumeTimer : handleHostPauseTimer}
                            style={{
                              background: hostHotseatData.timer_is_paused 
                                ? 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)'
                                : 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                              color: hostHotseatData.timer_is_paused ? '#000' : '#fff',
                              border: 'none',
                              fontWeight: '900',
                              padding: '0.6rem 1.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                              textTransform: 'uppercase',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            {hostHotseatData.timer_is_paused ? '▶️ RESUME TIMER' : '⏸️ PAUSE TIMER'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Host Lock Control */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                      {hostHotseatData.preselected_choice_id ? (
                        <button 
                          className="btn-submit glow-button" 
                          onClick={handleHostLockAnswer}
                          disabled={lockingHotseat}
                          style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                            color: '#000',
                            fontWeight: '900',
                            padding: '1rem 3.5rem',
                            fontSize: '1.25rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {lockingHotseat ? '🔐 LOCKING ANSWER...' : '🔐 LOCK ANSWER (Check Correctness)'}
                        </button>
                      ) : (
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem 3rem', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.2)', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                          ⏳ WAITING FOR CONTESTANT TO PRE-SELECT AN OPTION...
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="glass-card text-center" style={{ padding: '4rem' }}>
                    <h2 className="golden-glow">🎙️ CONSOLE ACTIVE</h2>
                    <p style={{ fontSize: '1.1rem' }}>No active contestant in the hotseat or awaiting the start of next question.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Interactive Ladder progress timeline + Correct Answer & Trivia */}
            <div className="hotseat-ladder-panel glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
              
              {/* Answer Key & Trivia Box */}
              {hostHotseatData?.question && (
                <div className="admin-key-trivia-box glass-card glow-cyan" style={{ padding: '1.25rem', border: '1px solid rgba(0, 188, 212, 0.4)', background: 'rgba(0, 188, 212, 0.04)', borderRadius: '10px' }}>
                  <h3 className="golden-glow" style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    🔑 ANSWER KEY & INFO
                  </h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Correct Answer</span>
                    <div style={{ fontSize: '1.05rem', color: '#4caf50', fontWeight: '900', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76,175,80,0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: '#4caf50', color: '#000', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.85rem' }}>{correctChoiceIndicator}</span>
                      <span>{correctChoice ? correctChoice.text : 'N/A'}</span>
                    </div>
                  </div>
                  
                  {hostHotseatData.question.trivia && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>💡 Host Trivia Note</span>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: '1.45', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        "{hostHotseatData.question.trivia}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="ladder-header golden-glow" style={{ fontSize: '1.1rem', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>SCORE LADDER (HOST)</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '0', marginBottom: '1rem' }}>Click to inspect constraints</p>
                <div className="ladder-list">
                  {SCORE_LADDER.map((step, idx) => {
                    const isActive = step.level === (progressLevel + 1);
                    const isPassed = step.level <= progressLevel;
                    return (
                      <div 
                        key={step.level} 
                        className={`ladder-step ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''} ${step.checkpoint ? 'checkpoint' : ''}`}
                        onClick={() => handleLadderLevelClick(step.level)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="step-num">{step.level}</span>
                        <span className="step-score">{formatPoints(step.score)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      );
    }

    // View if player is the actual Hotseat Contestant
    if (liveState.student_role === 'hotseat_player') {
      if (hotseatCompleted) {
        let endReason = "Incorrect Answer! Dropped to the nearest safety checkpoint.";
        if (hotseatStatus === 'walked_away') {
          endReason = "You chose to Walk Away! Safely secured your accumulated points.";
        } else if (hotseatStatus === 'completed') {
          endReason = "Amazing! You have successfully conquered the entire question ladder!";
        } else if (hotseatStatus === 'timeout') {
          endReason = "Time Out! You ran out of time.";
        }

        return (
          <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
            <div className="arena-background">
              <KbcStageFx intensity="lite" />
              <div className="arena-orb orb-pink" />
              <div className="arena-orb orb-cyan" />
            </div>
            {renderTopbar(`HOTSEAT CONCLUDED: ${session?.user?.full_name}`, "CONCLUDED", false, 0, hotseatScore)}
            <div className="arena-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
              <div className="arena-completed-panel glass-card text-center glow-blue" style={{ maxWidth: '600px', width: '90%', padding: '4rem 2rem' }}>
                <span className="arena-status" style={{ background: '#00bfff', color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ROUND CONCLUDED</span>
                <h2 className="golden-glow" style={{ fontSize: '2.5rem', margin: '1rem 0 1.5rem 0', fontWeight: '900' }}>GAME OVER</h2>
                <div className="arena-score-display" style={{ margin: '2rem 0' }}>
                  <span className="score-kicker" style={{ display: 'block', fontSize: '1rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YOUR FINAL SCORE</span>
                  <strong style={{ fontSize: '4.5rem', color: '#ffd700', textShadow: '0 0 15px rgba(255,215,0,0.5)' }}>{hotseatScore} pts</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Reason for Ending</span>
                  <p style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 'bold' }}>{endReason}</p>
                </div>
                <p style={{ color: '#94a3b8' }}>Waiting for the host to transition to the next event stage...</p>
              </div>
            </div>
          </main>
        );
      }

      // Question loaded inline to keep UI layout stable during intro transition

      if (liveState?.hotseat_attempt && !liveState.hotseat_attempt.showing_question) {
        const isFirstQuestion = liveState.hotseat_attempt.current_question_index === 0 && liveState.hotseat_attempt.score === 0;
        return (
          <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
            {introComponent}
            <div className="arena-background">
              <KbcStageFx intensity="lite" />
              <div className="arena-orb orb-pink" />
              <div className="arena-orb orb-cyan" />
            </div>
            {renderTopbar(`HOTSEAT LIVE: ${session?.user?.full_name}`, "HOTSEAT CONTENDER", false, 0, liveState?.hotseat_attempt?.score)}

            <div className="arena-center animate-fade-in" style={{ padding: '2rem' }}>
              {isFirstQuestion ? (
                <div className="glass-card glow-blue text-center" style={{ maxWidth: '600px', width: '95%', padding: '3.5rem', borderRadius: '16px', border: '1px solid rgba(0, 191, 255, 0.4)', background: 'rgba(0, 191, 255, 0.02)' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', animation: 'scaleUp 0.3s ease' }}>🎙️</div>
                  <h2 className="golden-glow" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '0.05em' }}>WELCOME TO THE HOTSEAT!</h2>
                  <p style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 2rem 0', lineHeight: '1.6' }}>
                    Prepare yourself for the ultimate intelligence test. You are the live contender in the Hotseat!
                  </p>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)', padding: '1rem', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    ⏳ Awaiting the Host to present the first question...
                  </div>
                </div>
              ) : (
                <div className="glass-card glow-green text-center" style={{ maxWidth: '600px', width: '95%', padding: '3.5rem', borderRadius: '16px', border: '1px solid rgba(76, 175, 80, 0.4)', background: 'rgba(76, 175, 80, 0.02)' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', animation: 'scaleUp 0.3s ease' }}>🎉</div>
                  <h2 className="golden-glow" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '0.05em' }}>CORRECT ANSWER!</h2>
                  <p style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 2rem 0', lineHeight: '1.6' }}>
                    Congratulations! You have successfully answered the question. 
                    <br />
                    Total Points Earned: <strong className="winner-text" style={{ color: '#ffd700', fontSize: '1.5rem', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>{liveState.hotseat_attempt.score} pts</strong>
                  </p>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)', padding: '1rem', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    ⏳ Awaiting the Host to push the next question...
                  </div>
                </div>
              )}
            </div>
          </main>
        );
      }

      return (
        <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
          {introComponent}
          <div className="arena-background">
            <KbcStageFx intensity="lite" />
            <div className="arena-orb orb-pink" />
            <div className="arena-orb orb-cyan" />
          </div>
          {renderTopbar(`HOTSEAT LIVE: ${session?.user?.full_name}`, "HOTSEAT CONTENDER", hotseatTimeLeft !== null, hotseatTimeLeft, liveState?.hotseat_attempt?.score)}

          {/* Pending Lifeline Request Overlay */}
          {liveState?.hotseat_attempt?.lifeline_request_status === 'requested' && (
            <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 999 }}>
              <div className="modal-content glass-card glow-gold text-center animate-pulse" style={{ maxWidth: '450px', padding: '2.5rem' }}>
                <div className="loading-spinner-hourglass" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⌛</div>
                {liveState.hotseat_attempt.pending_lifeline_type === 'walkaway' ? (
                  <>
                    <h2 className="golden-glow" style={{ margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '0.05em', color: '#f44336' }}>WALK AWAY PENDING</h2>
                    <p style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.05rem', lineHeight: '1.5' }}>
                      Your request to <strong style={{ color: '#f44336', textTransform: 'uppercase' }}>Walk Away</strong> from the game with your accumulated points is awaiting approval from the host.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="golden-glow" style={{ margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '0.05em' }}>LIFELINE PENDING</h2>
                    <p style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.05rem', lineHeight: '1.5' }}>
                      Your request to use the <strong style={{ color: '#ffd700', textTransform: 'uppercase' }}>{liveState.hotseat_attempt.pending_lifeline_type === '5050' ? '50:50' : liveState.hotseat_attempt.pending_lifeline_type === 'poll' ? 'Audience Poll' : 'Switch Question'}</strong> lifeline is awaiting approval from the host.
                    </p>
                  </>
                )}
                <div className="helper-text" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                  Please standby. The host will approve your request shortly...
                </div>
              </div>
            </div>
          )}

          <div className="hotseat-layout">
            {/* Left Console: Lifelines + Questions */}
            <div className="hotseat-console-panel">
              
              {/* KBC Lifeline Buttons */}
              <div className="lifelines-row">
                <button 
                  className={`btn-lifeline ${liveState?.hotseat_attempt?.lifeline_5050_used ? 'used' : ''} ${(!liveState?.hotseat_attempt?.options_visible || liveState?.hotseat_attempt?.current_question_index >= 14) ? 'locked' : ''}`}
                  onClick={handleUse5050}
                  disabled={liveState?.hotseat_attempt?.lifeline_5050_used || liveState?.hotseat_attempt?.current_question_index >= 14 || !liveState?.hotseat_attempt?.options_visible}
                  title={liveState?.hotseat_attempt?.current_question_index >= 14 ? "Lifelines locked on Q15" : !liveState?.hotseat_attempt?.options_visible ? "Options must be revealed first" : "Use 50:50"}
                  style={{ position: 'relative' }}
                >
                  <div className="lifeline-ring">
                    <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '2px' }}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fff8c8" />
                          <stop offset="50%" stopColor="#ffd700" />
                          <stop offset="100%" stopColor="#b8860b" />
                        </linearGradient>
                      </defs>
                      <circle cx="38" cy="22" r="14" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
                      <circle cx="62" cy="22" r="14" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" strokeDasharray="3,2" />
                      <text x="50%" y="48" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900">50:50</text>
                    </svg>
                  </div>
                  {liveState?.hotseat_attempt?.lifeline_5050_used && (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                      <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                      <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <button 
                  className={`btn-lifeline ${liveState?.hotseat_attempt?.lifeline_poll_used ? 'used' : ''} ${(!liveState?.hotseat_attempt?.options_visible || liveState?.hotseat_attempt?.current_question_index >= 14) ? 'locked' : ''}`}
                  onClick={handleUseAudiencePoll}
                  disabled={liveState?.hotseat_attempt?.lifeline_poll_used || liveState?.hotseat_attempt?.current_question_index >= 14 || !liveState?.hotseat_attempt?.options_visible}
                  title={liveState?.hotseat_attempt?.current_question_index >= 14 ? "Lifelines locked on Q15" : !liveState?.hotseat_attempt?.options_visible ? "Options must be revealed first" : "Use Audience Poll"}
                  style={{ position: 'relative' }}
                >
                  <div className="lifeline-ring">
                    <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '4px' }}>
                      <defs>
                        <linearGradient id="blueGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#0052d4" />
                          <stop offset="100%" stopColor="#21d3ee" />
                        </linearGradient>
                      </defs>
                      <rect x="25" y="24" width="10" height="14" rx="1.5" fill="url(#blueGrad)" />
                      <rect x="45" y="14" width="10" height="24" rx="1.5" fill="url(#blueGrad)" />
                      <rect x="65" y="6" width="10" height="32" rx="1.5" fill="url(#blueGrad)" />
                      <text x="50%" y="49" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">POLL</text>
                    </svg>
                  </div>
                  {liveState?.hotseat_attempt?.lifeline_poll_used && (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                      <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                      <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <button 
                  className={`btn-lifeline ${liveState?.hotseat_attempt?.lifeline_switch_used ? 'used' : ''} ${(!liveState?.hotseat_attempt?.options_visible || liveState?.hotseat_attempt?.current_question_index >= 14) ? 'locked' : ''}`}
                  onClick={handleUseSwitchQuestion}
                  disabled={liveState?.hotseat_attempt?.lifeline_switch_used || liveState?.hotseat_attempt?.current_question_index >= 14 || !liveState?.hotseat_attempt?.options_visible}
                  title={liveState?.hotseat_attempt?.current_question_index >= 14 ? "Lifelines locked on Q15" : !liveState?.hotseat_attempt?.options_visible ? "Options must be revealed first" : "Use Switch Question"}
                  style={{ position: 'relative' }}
                >
                  <div className="lifeline-ring">
                    <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '2px' }}>
                      <defs>
                        <linearGradient id="switchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#db2777" />
                        </linearGradient>
                      </defs>
                      <path d="M 38 16 A 14 14 0 0 1 63 26" fill="none" stroke="url(#switchGrad)" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 62 36 A 14 14 0 0 1 37 26" fill="none" stroke="url(#switchGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="3,2" />
                      <polygon points="63,20 70,28 56,28" fill="#f472b6" />
                      <polygon points="37,32 30,24 44,24" fill="#db2777" />
                      <text x="50%" y="49" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="900">SWITCH</text>
                    </svg>
                  </div>
                  {liveState?.hotseat_attempt?.lifeline_switch_used && (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                      <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                      <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Question Screen */}
              <div className="active-question-section">
                {!hotseatQuestion ? (
                  <div className="arena-question-card glass-card text-center" style={{ padding: '3.5rem', border: '1px solid rgba(255, 183, 77, 0.2)' }}>
                    <div className="loading-spinner-hourglass" style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--dash-gold)' }}>⏳</div>
                    <h3 className="golden-glow" style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', fontWeight: '800' }}>PREPARING TERMINAL</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Waiting for the host to push the question data...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      {liveState?.hotseat_attempt?.current_question_switched ? (
                        <span className="question-category-tag" style={{ margin: 0 }}>CATEGORY: {hotseatQuestion.category}</span>
                      ) : <div />}
                      {liveState?.hotseat_attempt?.current_question_switched && (
                        <span className="switched-badge animate-pulse" style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--dash-gold)', color: 'var(--dash-gold-bright)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem', textShadow: '0 0 5px rgba(255,215,0,0.5)' }}>
                          🔄 SWITCHED QUESTION
                        </span>
                      )}
                    </div>
                    <article className="arena-question-card glass-card kbc-question-frame">
                      <h2>{hotseatQuestion.text}</h2>
                    </article>

                    <div className="kbc-choices-grid">
                      {hotseatQuestion.choices.map((choice, i) => {
                        const isEliminated = eliminatedChoiceIds.includes(choice.id);
                        const isChoiceVisible = liveState?.hotseat_attempt?.options_visible && (revealedChoicesCount > i);
                        return (
                          <button 
                            key={choice.id}
                            className={`arena-choice-btn kbc-choice ${selectedHotseatChoice === choice.id ? 'selected' : ''} ${isEliminated ? 'eliminated' : ''}`}
                            onClick={() => handleHotseatChoiceClick(choice.id)}
                            disabled={isEliminated || submittingHotseat || !isChoiceVisible}
                            style={{
                              opacity: isChoiceVisible ? 1 : 0,
                              pointerEvents: isChoiceVisible ? 'auto' : 'none',
                              transform: isChoiceVisible ? 'translateY(0)' : 'translateY(10px)',
                              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
                            }}
                          >
                            <div className="choice-indicator">{['A','B','C','D'][i]}</div>
                            <div className="choice-text">{isEliminated ? "" : choice.text}</div>
                          </button>
                        );
                      })}
                    </div>

                    {liveState?.hotseat_attempt?.options_visible && (
                      <div className="hotseat-action-row" style={{ justifyContent: 'center' }}>
                        <button className="btn-walkaway glow-red" onClick={handleWalkAway} disabled={submittingHotseat}>
                          🏃 WALK AWAY (Lock Current Score)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Panel: Score Ladder */}
            <div className="hotseat-ladder-panel glass-card">
              <h3 className="ladder-header golden-glow">SCORE LADDER</h3>
              <div className="ladder-list">
                {SCORE_LADDER.map((step, idx) => {
                  const isCurrent = step.level === (hotseatIndex + 1);
                  const isPassed = step.level <= hotseatIndex;
                  return (
                    <div 
                      key={step.level} 
                      className={`ladder-step ${isCurrent ? 'active' : ''} ${isPassed ? 'passed' : ''} ${step.checkpoint ? 'checkpoint' : ''}`}
                    >
                      <span className="step-num">{step.level}</span>
                      <span className="step-score">{formatPoints(step.score)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audience Poll Modal */}
          {showPollModal && pollVotes && (
            <div className="modal-overlay">
              <div className="modal-content poll-modal glass-card glow-blue" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', padding: '2.5rem' }}>
                <h2 className="golden-glow" style={{ marginBottom: '0.5rem' }}>
                  {pollAnimating 
                    ? `COLLECTING VOTES... (${pollTimeLeft}s left)` 
                    : 'AUDIENCE POLL RESULTS'
                  }
                </h2>
                {pollAnimating ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', animation: 'pulse 1.2s infinite' }}>
                    📊 Spectators are submitting their votes in real-time... ({pollTimeLeft} seconds remaining)
                  </p>
                ) : (
                  <p style={{ color: '#4caf50', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                    ✨ Poll Closed! Final results calculated.
                  </p>
                )}
                <div className="poll-chart-container">
                  {hotseatQuestion.choices.map((choice, i) => {
                    const percentage = (pollVotes && pollVotes[choice.id]) || 0;
                    const isHighest = !pollAnimating && percentage === Math.max(...Object.values(pollVotes));
                    return (
                      <div key={choice.id} className="poll-bar-col">
                        <div className="poll-bar-wrapper">
                          <div
                            className={`poll-bar-fill ${isHighest && !pollAnimating ? 'poll-bar-winner' : ''}`}
                            style={{
                              height: `${percentage}%`,
                              transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              background: isHighest && !pollAnimating
                                ? 'linear-gradient(180deg, #ffd700, #ff8c00)'
                                : undefined
                            }}
                          >
                            <span className="poll-pct">{percentage}%</span>
                          </div>
                        </div>
                        <div className="poll-bar-label" style={{ fontWeight: isHighest && !pollAnimating ? '900' : '600', color: isHighest && !pollAnimating ? '#ffd700' : undefined }}>
                          {['A','B','C','D','E','F','G','H'][i] || i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button 
                  className="btn-submit" 
                  disabled={pollAnimating || pollTimeLeft > 0} 
                  onClick={async () => {
                    try {
                      await acknowledgeHotseatLifeline(id, session?.token);
                      setShowPollModal(false);
                    } catch (err) {
                      console.error("Failed to close poll lifeline:", err);
                      setShowPollModal(false);
                    }
                  }} 
                  style={{ 
                    marginTop: '1.5rem',
                    background: (pollAnimating || pollTimeLeft > 0) ? 'rgba(255,255,255,0.05)' : undefined,
                    cursor: (pollAnimating || pollTimeLeft > 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {(pollAnimating || pollTimeLeft > 0) ? `🗳️ VOTING IN PROGRESS (${pollTimeLeft}s)` : 'CLOSE RESULTS'}
                </button>
              </div>
            </div>
          )}

          {/* Switch Question category picker Modal */}
          {showCategorySelector && (
            <div className="modal-overlay" style={{ background: 'rgba(3, 2, 6, 0.95)', zIndex: 1000 }}>
              <div className="modal-content glass-card glow-pink" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', padding: '3rem' }}>
                <span className="overview-kicker" style={{ color: '#f472b6', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔄 SWITCH QUESTION ACTIVATED</span>
                <h2 className="golden-glow" style={{ margin: '0.5rem 0 1rem 0', fontSize: '2.2rem', fontWeight: '900' }}>SELECT YOUR PREFERRED DOMAIN</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
                  The host has approved your lifeline! Reveal the categories and select the domain you wish to swap this question with.
                </p>
                
                {(() => {
                  const selectedCategoryStr = liveState?.hotseat_attempt?.pending_lifeline_switch_category;
                  const isCategorySelected = selectedCategoryStr && selectedCategoryStr.includes(':');
                  const selectedCategoryName = isCategorySelected ? selectedCategoryStr.split(':', 2)[1] : '';

                  if (isCategorySelected) {
                    return (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', animation: 'spin 4s linear infinite', display: 'inline-block' }}>🔄</div>
                        <h3 style={{ color: '#fff', fontSize: '1.6rem', margin: '0 0 1rem 0', fontWeight: '800' }}>
                          Domain Chosen: <span style={{ color: 'var(--dash-gold-bright)', textShadow: '0 0 10px rgba(212,175,55,0.4)' }}>{selectedCategoryName}</span>
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' }}>
                          Your domain selection has been transmitted to the host console. Please wait while the host triggers the question swap.
                        </p>
                      </div>
                    );
                  }

                  return loadingCategories ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                      <div className="loading-spinner-hourglass" style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'spin 2s linear infinite' }}>⏳</div>
                      <p style={{ color: '#94a3b8' }}>Loading Switch Categories...</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                        {switchCategoriesList.map((cat) => {
                          const isSelected = selectedCategoryId === cat.id;
                          return (
                            <div 
                              key={cat.id} 
                              onClick={() => setSelectedCategoryId(cat.id)}
                              style={{ 
                                background: isSelected ? 'rgba(219,39,119,0.12)' : 'rgba(255,255,255,0.02)',
                                border: isSelected ? '2px solid #db2777' : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isSelected ? '0 0 25px rgba(219,39,119,0.3)' : 'none'
                              }}
                              className="tilt-card"
                            >
                              <div style={{ width: '100%', height: '110px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {cat.image ? (
                                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}>📚</div>
                                )}
                              </div>
                              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isSelected ? '#db2777' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button 
                          className="btn-submit" 
                          disabled={!selectedCategoryId || submittingCategoryChoice}
                          onClick={handleConfirmSwitchCategory}
                          style={{ width: 'auto', minWidth: '220px' }}
                        >
                          {submittingCategoryChoice ? 'SWITCHING QUESTION...' : '🔄 CONFIRM SWITCH'}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </main>
      );
    }

    // Spectator view for Hotseat Round (Replica)
    const activeContestantName = liveState?.hotseat_attempt?.student_name || `Batch ${activeBatch} Contestant`;
    const progressLevel = liveState?.hotseat_attempt?.current_question_index || 0;
    const currentContestantScore = liveState?.hotseat_attempt?.score || 0;

    return (
      <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'} ${poweringOn ? 'arena-power-on' : ''}`}>
        {introComponent}
        <div className="arena-background">
          <KbcStageFx intensity="lite" />
          <div className="arena-orb orb-pink" />
          <div className="arena-orb orb-cyan" />
        </div>
        {renderTopbar(`SPECTATING HOTSEAT ROUND (BATCH ${activeBatch})`, "SPECTATING ARENA")}

        <div className="hotseat-layout">
          {/* Left Panel: Active replica board */}
          <div className="hotseat-console-panel">
            
            {/* Lifelines Status Row */}
            <div className="lifelines-row">
              <div 
                className={`btn-lifeline disabled ${liveState?.hotseat_attempt?.lifeline_5050_used ? 'used' : ''}`}
                style={{ position: 'relative' }}
              >
                <div className="lifeline-ring">
                  <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '2px' }}>
                    <defs>
                      <linearGradient id="goldGradSpec" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff8c8" />
                        <stop offset="50%" stopColor="#ffd700" />
                        <stop offset="100%" stopColor="#b8860b" />
                      </linearGradient>
                    </defs>
                    <circle cx="38" cy="22" r="14" fill="none" stroke="url(#goldGradSpec)" strokeWidth="2.5" />
                    <circle cx="62" cy="22" r="14" fill="none" stroke="url(#goldGradSpec)" strokeWidth="2.5" strokeDasharray="3,2" />
                    <text x="50%" y="48" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900">50:50</text>
                  </svg>
                </div>
                {liveState?.hotseat_attempt?.lifeline_5050_used && (
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                    <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              <div 
                className={`btn-lifeline disabled ${liveState?.hotseat_attempt?.lifeline_poll_used ? 'used' : ''}`}
                style={{ position: 'relative' }}
              >
                <div className="lifeline-ring">
                  <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '4px' }}>
                    <defs>
                      <linearGradient id="blueGradSpec" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#0052d4" />
                        <stop offset="100%" stopColor="#21d3ee" />
                      </linearGradient>
                    </defs>
                    <rect x="25" y="24" width="10" height="14" rx="1.5" fill="url(#blueGradSpec)" />
                    <rect x="45" y="14" width="10" height="24" rx="1.5" fill="url(#blueGradSpec)" />
                    <rect x="65" y="6" width="10" height="32" rx="1.5" fill="url(#blueGradSpec)" />
                    <text x="50%" y="49" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">POLL</text>
                  </svg>
                </div>
                {liveState?.hotseat_attempt?.lifeline_poll_used && (
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                    <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              <div 
                className={`btn-lifeline disabled ${liveState?.hotseat_attempt?.lifeline_switch_used ? 'used' : ''}`}
                style={{ position: 'relative' }}
              >
                <div className="lifeline-ring">
                  <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', padding: '2px' }}>
                    <defs>
                      <linearGradient id="switchGradSpec" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#db2777" />
                      </linearGradient>
                    </defs>
                    <path d="M 38 16 A 14 14 0 0 1 63 26" fill="none" stroke="url(#switchGradSpec)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 62 36 A 14 14 0 0 1 37 26" fill="none" stroke="url(#switchGradSpec)" strokeWidth="3" strokeLinecap="round" strokeDasharray="3,2" />
                    <polygon points="63,20 70,28 56,28" fill="#f472b6" />
                    <polygon points="37,32 30,24 44,24" fill="#db2777" />
                    <text x="50%" y="49" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="900">SWITCH</text>
                  </svg>
                </div>
                {liveState?.hotseat_attempt?.lifeline_switch_used && (
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                    <line x1="12" y1="8" x2="63" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    <line x1="63" y1="8" x2="12" y2="42" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </div>

            {/* Display Screen */}
            <div className="active-question-section">
              <div className="glass-card panel-intro text-center glow-blue">
                <h3>Contestant: <strong className="winner-text">{activeContestantName}</strong></h3>
                <p>Current Score: <strong className="winner-text">{currentContestantScore} pts</strong></p>
              </div>

              {liveState.hotseat_attempt?.status !== 'playing' ? (
                <div className="glass-card text-center" style={{padding: '3rem'}}>
                  <h2 className="golden-glow">HOTSEAT COMPLETED</h2>
                  <p>Contestant run has concluded. Final score: <strong>{currentContestantScore} pts</strong></p>
                  <p className="helper-text">Waiting for organizer to select next batch or conclude event.</p>
                </div>
              ) : hotseatQuestion ? (
                <>
                  {/* Real-time Spectator Audience Poll Alert Banner */}
                  {liveState?.hotseat_attempt?.pending_lifeline_type === 'poll' && 
                   liveState?.hotseat_attempt?.lifeline_request_status === 'approved' && 
                   pollTimeLeft > 0 && (
                    <div className="glass-card glow-cyan text-center animate-pulse" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(0, 191, 255, 0.1)', border: '1px solid #00bfff', borderRadius: '8px' }}>
                      <span className="golden-glow" style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🗳️ LIVE AUDIENCE POLL IS ACTIVE!</span>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                        {spectatorVotedChoiceId 
                          ? `You voted for Option ${['A','B','C','D'][hotseatQuestion.choices.findIndex(c => c.id === spectatorVotedChoiceId)]}! Waiting for others... (${pollTimeLeft}s remaining)`
                          : `Submit your vote below! Time remaining: ${pollTimeLeft} seconds`
                        }
                      </p>
                    </div>
                  )}

                  {/* If Poll has closed, show the final results directly to the spectator */}
                  {liveState?.hotseat_attempt?.pending_lifeline_type === 'poll' && 
                   liveState?.hotseat_attempt?.lifeline_request_status === 'approved' && 
                   pollTimeLeft === 0 && 
                   liveState?.hotseat_attempt?.approved_lifeline_data?.votes ? (
                    <>
                      <div className="glass-card glow-blue text-center" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(33, 211, 238, 0.05)', border: '1px solid rgba(33, 211, 238, 0.3)', borderRadius: '10px' }}>
                        <span className="golden-glow" style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 AUDIENCE POLL RESULTS</span>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Spectators have spoken! Here are the finalized results:</p>
                      </div>
                      
                      <div className="poll-chart-container" style={{ margin: '2rem auto', maxWidth: '500px', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {hotseatQuestion.choices.map((choice, i) => {
                          const displayVotes = liveState.hotseat_attempt.approved_lifeline_data.votes;
                          const percentage = (displayVotes && displayVotes[choice.id]) || 0;
                          const isHighest = percentage === Math.max(...Object.values(displayVotes));
                          return (
                            <div key={choice.id} className="poll-bar-col">
                              <div className="poll-bar-wrapper">
                                <div
                                  className={`poll-bar-fill ${isHighest ? 'poll-bar-winner' : ''}`}
                                  style={{
                                    height: `${percentage}%`,
                                    transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    background: isHighest ? 'linear-gradient(180deg, #ffd700, #ff8c00)' : undefined
                                  }}
                                >
                                  <span className="poll-pct">{percentage}%</span>
                                </div>
                              </div>
                              <div className="poll-bar-label" style={{ fontWeight: isHighest ? '900' : '600', color: isHighest ? '#ffd700' : undefined }}>
                                {['A','B','C','D'][i]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      {liveState?.hotseat_attempt?.current_question_switched ? (
                        <span className="question-category-tag">CATEGORY: {hotseatQuestion.category}</span>
                      ) : null}
                      <article className="arena-question-card glass-card kbc-question-frame">
                        <h2>{hotseatQuestion.text}</h2>
                      </article>

                      <div className="kbc-choices-grid">
                        {hotseatQuestion.choices.map((choice, i) => {
                          const isPollActive = liveState?.hotseat_attempt?.pending_lifeline_type === 'poll' && 
                                             liveState?.hotseat_attempt?.lifeline_request_status === 'approved' && 
                                             pollTimeLeft > 0;
                          
                          if (isPollActive) {
                            const hasVoted = spectatorVotedChoiceId !== null;
                            const isVotedChoice = spectatorVotedChoiceId === choice.id;
                            
                            return (
                              <button 
                                key={choice.id}
                                className={`arena-choice-btn kbc-choice ${isVotedChoice ? 'selected' : ''}`}
                                onClick={() => handleSpectatorVoteClick(choice.id)}
                                disabled={hasVoted || submittingSpectatorVote || pollTimeLeft <= 0}
                                style={{
                                  cursor: (hasVoted || pollTimeLeft <= 0) ? 'not-allowed' : 'pointer',
                                  pointerEvents: (hasVoted || pollTimeLeft <= 0) ? 'none' : 'auto',
                                  border: isVotedChoice ? '2px solid #00efff' : undefined,
                                  boxShadow: isVotedChoice ? '0 0 15px rgba(0, 239, 255, 0.4)' : undefined,
                                  background: isVotedChoice ? 'rgba(0, 239, 255, 0.1)' : undefined
                                }}
                              >
                                <div className="choice-indicator">{['A','B','C','D'][i]}</div>
                                <div className="choice-text">{choice.text}</div>
                              </button>
                            );
                          }
                          
                          const isChoiceVisible = liveState?.hotseat_attempt?.options_visible && (revealedChoicesCount > i);
                          return (
                            <div 
                              key={choice.id}
                              className="arena-choice-btn kbc-choice disabled"
                              style={{
                                opacity: isChoiceVisible ? 1 : 0,
                                pointerEvents: 'none',
                                transform: isChoiceVisible ? 'translateY(0)' : 'translateY(10px)',
                                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            >
                              <div className="choice-indicator">{['A','B','C','D'][i]}</div>
                              <div className="choice-text">{isChoiceVisible ? choice.text : ""}</div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="glass-card text-center" style={{padding: '3rem'}}>
                  <h3>Loading active hotseat question replicas...</h3>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: replica ladder */}
          <div className="hotseat-ladder-panel glass-card">
            <h3 className="ladder-header golden-glow">SCORE LADDER</h3>
            <div className="ladder-list">
              {SCORE_LADDER.map((step, idx) => {
                const isCurrent = step.level === (progressLevel + 1);
                const isPassed = step.level <= progressLevel;
                return (
                  <div 
                    key={step.level} 
                    className={`ladder-step ${isCurrent ? 'active' : ''} ${isPassed ? 'passed' : ''} ${step.checkpoint ? 'checkpoint' : ''}`}
                  >
                    <span className="step-num">{step.level}</span>
                    <span className="step-score">{formatPoints(step.score)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fallback default
  return (
    <main className={`arena-page kbc-broadcast ${isLight ? 'theme-light' : 'theme-dark'}`}>
      <div className="arena-center">
        <h2>Live Arena Standby</h2>
        <p>Connecting with server machine...</p>
      </div>
    </main>
  );
}

function QuizArenaPage() {
  const [popupConfig, setPopupConfig] = useState(null);

  const showBeautifulPopup = (title, message, type = 'info', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setPopupConfig({ title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };

  return (
    <>
      <QuizArenaInner showBeautifulPopup={showBeautifulPopup} />
      {popupConfig && (
        <div className="modal-overlay" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className={`modal-content glass-card glow-${popupConfig.type === 'error' ? 'red' : popupConfig.type === 'success' ? 'green' : 'blue'}`} style={{ maxWidth: '450px', width: '90%', padding: '2rem', textAlign: 'center', animation: 'scaleUp 0.3s ease', borderRadius: '12px' }}>
            <h2 style={{
              color: popupConfig.type === 'error' ? 'var(--admin-red)' : popupConfig.type === 'success' ? '#4caf50' : 'var(--admin-cyan)',
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.8rem',
              letterSpacing: '0.05em',
              fontWeight: '900'
            }}>
              {popupConfig.type === 'error' ? '🚨 ' : popupConfig.type === 'success' ? '🎉 ' : '💡 '}
              {popupConfig.title}
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.5', margin: '0 0 2rem 0', color: 'rgba(255, 255, 255, 0.95)' }}>
              {popupConfig.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {popupConfig.onCancel && (
                <button 
                  className="prelim-reset-btn" 
                  onClick={() => {
                    popupConfig.onCancel();
                    setPopupConfig(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '0.6rem 2rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {popupConfig.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                className="btn-submit" 
                onClick={() => {
                  if (popupConfig.onConfirm) popupConfig.onConfirm();
                  setPopupConfig(null);
                }}
                style={{
                  padding: '0.6rem 2.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: popupConfig.type === 'error' 
                    ? 'linear-gradient(135deg, #f44336 0%, #c62828 100%)' 
                    : popupConfig.type === 'success' 
                      ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' 
                      : 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '900',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                {popupConfig.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuizArenaPage;
