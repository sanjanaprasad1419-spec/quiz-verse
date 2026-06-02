import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthSession, changePassword, clearAuthSession } from '../../api/auth';
import { getPublishedQuizzes, getMyRegistrations, registerForQuiz, processMockPayment } from '../../api/quizzes';
import KbcStageFx from '../KbcStageFx/KbcStageFx';
import './DashboardPage.css';

const LockIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SYMBOLS = {
  triangle: '\u25B3',
  circle: '\u25CB',
  square: '\u25A1',
  diamond: '\u25C7',
  dot: '\u00B7',
  gear: '\u2699',
  bell: '\u25CC',
  moon: '\u25D0',
  sun: '\u2609',
  exit: '\u21B3',
  check: '\u2713',
  upload: '\u2191',
};

function DashboardPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('quizverse-theme') || 'dark');
  const [profileImage, setProfileImage] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [coreOffset, setCoreOffset] = useState({ x: 0, y: 0 });
  const [publishedQuizzes, setPublishedQuizzes] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const isLight = theme === 'light';
  
  const session = getAuthSession();
  const navigate = useNavigate();
  const studentData = session?.student || {};
  const student = {
    name: studentData.full_name || 'Student',
    school: studentData.school_name || 'School',
    branch: studentData.branch_name || 'Branch',
    year: studentData.year ? `${studentData.year} Year` : 'Year',
    status: 'Competition Ready',
    lastBadge: studentData.last_badge || 'QUALIFIER',
  };



  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const token = session?.token;
      if (!token) return;

      const [quizzesData, registrationsData] = await Promise.all([
        getPublishedQuizzes(token),
        getMyRegistrations(token)
      ]);

      setPublishedQuizzes(quizzesData);
      setMyRegistrations(registrationsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Live synchronization: re-fetch published quizzes and registrations every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (quizId) => {
    try {
      setActionLoading(true);
      setError('');
      await registerForQuiz(quizId, session?.token);
      await fetchDashboardData();
      // Keep drawer open, update selected object if needed or close it
      const updatedQuiz = publishedQuizzes.find(q => q.id === quizId);
      setSelectedQuiz(updatedQuiz);
    } catch (err) {
      setError(err.data?.detail || 'Failed to register.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMockPayment = async (quizId) => {
    try {
      setActionLoading(true);
      setError('');
      await processMockPayment(quizId, session?.token);
      await fetchDashboardData();
    } catch (err) {
      setError(err.data?.detail || 'Payment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(session?.token, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      setPasswordSuccess('Password changed successfully! Redirecting to login...');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        clearAuthSession();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setPasswordError(err.data?.detail || err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const linePoints = '0,52 34,44 68,48 102,28 136,34 170,18 204,24 238,12';

  useEffect(() => {
    localStorage.setItem('quizverse-theme', theme);
  }, [theme]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 28;

    setCoreOffset({ x, y });
  };

  const renderProfile = () => (
    <article className="profile-module tilt-card">
      <div className="profile-photo-wrap">
        <div className="profile-orbit" />
        <div className="profile-photo">
          <span>{student.name.slice(0, 1).toUpperCase()}</span>
        </div>
      </div>
      <div className="profile-copy">
        <span className="module-kicker">Student Identity</span>
        <h2>{student.name}</h2>
        <p>{student.branch} {SYMBOLS.dot} {student.year}</p>
        <div className="profile-status-row">
          <span>{student.status}</span>
        </div>
        
        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <span className="stat-label">REGISTERED</span>
            <strong className="stat-value">{myRegistrations.length}</strong>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">LIVE ARENAS</span>
            <strong className="stat-value">{myRegistrations.filter(r => r.payment_status === 'paid').length}</strong>
          </div>
          <div className="profile-stat-box">
            <span className="stat-label">CONTEST LEVEL</span>
            <strong className="stat-value">LVL {myRegistrations.length > 0 ? '02' : '01'}</strong>
          </div>
        </div>
        <button
          className="change-password-btn"
          onClick={() => { setShowPasswordModal(true); setPasswordError(''); setPasswordSuccess(''); }}
          style={{
            marginTop: '1.2rem',
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.85rem',
            fontWeight: '600',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <LockIcon size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> CHANGE PASSWORD
        </button>
      </div>
    </article>
  );

  const renderAvailableEvents = () => (
    <article className="event-hero tilt-card">
      <div className="event-copy">
        <span className="event-status">Active Quizzes</span>
        <h2>Available Events</h2>
        <p>Select a published event to view details and register.</p>
        
        {loading ? (
          <div className="event-list-container"><span style={{color: 'rgba(255,255,255,0.7)'}}>Initializing arena scanner...</span></div>
        ) : publishedQuizzes.length === 0 ? (
          <p style={{marginTop: '1rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
            No competition windows are currently open.<br/>
            Await the next arena activation.
          </p>
        ) : (
          <div className="event-list-container">
            {publishedQuizzes.map((quiz, index) => (
              <button 
                key={quiz.id} 
                className="event-list-item" 
                onClick={() => setSelectedQuiz(quiz)}
              >
                <div className="event-item-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="event-item-details">
                  <h3>{quiz.title}</h3>
                  <div className="event-item-meta">
                    <span>{quiz.registered_count} Registered</span>
                    {quiz.event_date && <span> • {new Date(quiz.event_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="event-item-action">ENTER &rarr;</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="event-visual-stack" aria-hidden="true">
        <span>{SYMBOLS.triangle}</span>
        <span>{SYMBOLS.circle}</span>
        <span>{SYMBOLS.square}</span>
      </div>
    </article>
  );



  const renderRegisteredQuizzes = () => (
    <article className="registered-panel tilt-card">
      <div className="panel-heading">
        <span>{SYMBOLS.triangle}</span>
        <h2>Registered Quizzes / Live Arena</h2>
      </div>

      <div className="registered-list">
        {loading ? (
          <p style={{color: 'var(--dash-muted)', padding: '1rem'}}>Scanning participation logs...</p>
        ) : myRegistrations.length === 0 ? (
          <p style={{color: 'var(--dash-muted)', padding: '1rem'}}>No participation records found in this sector.</p>
        ) : (
          myRegistrations.map((reg) => {
            const hasPaid = reg.payment_status === 'paid';
            const playerID = reg.player_id || 'Awaiting Payment';
            const actualPassword = reg.arena_password || '';
            const passwordDisplay = actualPassword;
            
            return (
              <div
                className={`registered-card ${hasPaid ? 'registered-paid-kbc' : 'registered-pending-kbc'}`}
                key={reg.id}
                onClick={() => setSelectedQuiz(reg.quiz_details)}
                style={{ cursor: 'pointer' }}
              >
                <div className="registered-card-main">
                  <div className="registered-card-header">
                    <span className="kbc-badge">ARENA EVENT</span>
                    <h3>{reg.quiz_details?.title}</h3>
                  </div>
                  
                  <div className="credentials-display-row">
                    <div className="credential-pill player-id-pill">
                      <span className="pill-label">Player ID</span>
                      <strong className="pill-val">{playerID}</strong>
                    </div>
                    <div className="credential-pill password-pill">
                      <span className="pill-label">Event Password</span>
                      <strong className="pill-val">{passwordDisplay}</strong>
                    </div>
                  </div>
                  
                  <div className="registered-card-meta">
                    <span>Payment: <strong className={hasPaid ? 'text-success' : 'text-warning'}>{reg.payment_status.toUpperCase()}</strong></span>
                    <span> • Registered: {new Date(reg.registered_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="registered-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="details-btn-card"
                    onClick={() => setSelectedQuiz(reg.quiz_details)}
                  >
                    VIEW DETAILS
                  </button>
                  {hasPaid ? (
                    <Link
                      to={`/quiz/${reg.quiz_details?.id}/play`}
                      className="enter-arena-btn-card"
                      onClick={() => {
                        localStorage.setItem(`quiz-${reg.quiz_details?.id}-player-id`, playerID);
                        localStorage.removeItem(`quiz-${reg.quiz_details?.id}-event-password`);
                        sessionStorage.removeItem(`quiz-${reg.quiz_details?.id}-verified`);
                      }}
                    >
                      ENTER ARENA &rarr;
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="payment-trigger-btn-card"
                      onClick={() => setSelectedQuiz(reg.quiz_details)}
                    >
                      PAY & ENTER
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );



  return (
    <main
      className="dashboard-page kbc-broadcast theme-dark"
      style={{ '--core-x': `${coreOffset.x}px`, '--core-y': `${coreOffset.y}px` }}
      onPointerMove={handlePointerMove}
    >
      <div className="dashboard-background" aria-hidden="true">
        <KbcStageFx intensity="lite" />
        <div className="ambient-core">
          <div className="ambient-core-ring ambient-ring-one" />
          <div className="ambient-core-ring ambient-ring-two" />
          <div className="ambient-core-ring ambient-ring-three" />
          <span>{SYMBOLS.triangle}</span>
          <i className="ambient-core-particle ambient-particle-one">{SYMBOLS.square}</i>
          <i className="ambient-core-particle ambient-particle-two">{SYMBOLS.circle}</i>
          <i className="ambient-core-particle ambient-particle-three">{SYMBOLS.diamond}</i>
        </div>
        <div className="dashboard-orb orb-pink" />
        <div className="dashboard-orb orb-mint" />
        <div className="dashboard-orb orb-cyan" />
        <div className="dashboard-grid" />
        <div className="dashboard-particles" />
        <span className="dash-env-symbol dash-symbol-triangle">{SYMBOLS.triangle}</span>
        <span className="dash-env-symbol dash-symbol-circle">{SYMBOLS.circle}</span>
        <span className="dash-env-symbol dash-symbol-square">{SYMBOLS.square}</span>
        <span className="dash-env-symbol dash-symbol-diamond">{SYMBOLS.diamond}</span>
        <div className="dash-field field-one" />
        <div className="dash-field field-two" />
      </div>

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="topbar-brand-welcome">
            <Link className="dashboard-brand" to="/">
              <span>{SYMBOLS.triangle}</span>
              QuizVerse
            </Link>
            <div className="welcome-info">
              <p className="welcome-kicker">Welcome back, {student.name}</p>
              <h1>{student.school} {SYMBOLS.dot} {student.branch} {SYMBOLS.dot} {student.year}</h1>
            </div>
          </div>

          <div className="topbar-actions" aria-label="Dashboard utilities">
            <Link to="/login" title="Logout">{SYMBOLS.exit}</Link>
          </div>
        </header>

        <section className="dashboard-intro-grid">
          {renderProfile()}
          {renderAvailableEvents()}
        </section>

        <section className="dashboard-lower-grid" style={{ gridTemplateColumns: '1fr' }}>
          {renderRegisteredQuizzes()}
        </section>
      </section>

      <aside className={`quiz-detail-drawer ${selectedQuiz ? 'open' : ''}`} aria-hidden={!selectedQuiz}>
        {selectedQuiz && (() => {
          const registration = myRegistrations.find(r => r.quiz === selectedQuiz.id);
          
          return (
          <>
            <button className="drawer-close" type="button" onClick={() => { setSelectedQuiz(null); setError(''); }}>x</button>
            <span className="module-kicker">Quiz Detail</span>
            <h2>{selectedQuiz.title}</h2>
            <p>{selectedQuiz.description || 'No description provided.'}</p>

            <div className="drawer-detail-grid">
              <div>
                <span>Status</span>
                <strong>{selectedQuiz.status.replace('_', ' ').toUpperCase()}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{selectedQuiz.event_date ? new Date(selectedQuiz.event_date).toLocaleDateString() : 'TBA'}</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>{parseFloat(selectedQuiz.registration_fee) === 0 ? 'No Registration Fee' : `₹${selectedQuiz.registration_fee}`}</strong>
              </div>
              <div>
                <span>Seats Left</span>
                <strong>{selectedQuiz.remaining_seats !== null ? selectedQuiz.remaining_seats : 'Unlimited'}</strong>
              </div>
            </div>

            {error && <div style={{color: 'rgb(255,100,100)', marginTop: '1rem', fontWeight: 'bold'}}>{error}</div>}

            <div className="drawer-section" style={{marginTop: '2rem'}}>
              {registration ? (
                <div style={{padding: '1rem', border: '1px solid rgba(var(--dash-mint-rgb), 0.3)', borderRadius: '8px', background: 'rgba(var(--dash-mint-rgb), 0.05)'}}>
                  <h3 style={{marginTop: 0, color: 'rgb(var(--dash-mint-rgb))'}}>Registration Status</h3>
                  <p style={{margin: '0.5rem 0'}}><strong>Payment Status:</strong> <span className={registration.payment_status === 'paid' ? 'text-success' : 'text-warning'}>{registration.payment_status.toUpperCase()}</span></p>
                  <p style={{margin: '0.5rem 0'}}><strong>Player ID:</strong> <span className="neon-value-green">{registration.player_id || 'Awaiting Payment'}</span></p>
                  <p style={{margin: '0.5rem 0'}}><strong>Event Password:</strong> <span className="neon-value-gold">{registration.arena_password || ''}</span></p>
                  
                  {registration.payment_status === 'pending' && parseFloat(selectedQuiz.registration_fee) > 0 && (
                    <button 
                      className="btn-submit" 
                      style={{marginTop: '1.25rem', width: '100%'}} 
                      onClick={() => handleMockPayment(selectedQuiz.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'PROCESSING...' : 'COMPLETE MOCK PAYMENT'}
                    </button>
                  )}
                  
                   {registration.payment_status === 'paid' && (
                    <Link
                      to={`/quiz/${selectedQuiz.id}/play`}
                      className="btn-submit"
                      style={{marginTop: '1.25rem', width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', background: 'linear-gradient(135deg, #ffd700, #d4af37)', color: '#000', fontWeight: 'bold'}}
                      onClick={() => {
                        localStorage.setItem(`quiz-${selectedQuiz.id}-player-id`, registration.player_id);
                        localStorage.removeItem(`quiz-${selectedQuiz.id}-event-password`);
                        sessionStorage.removeItem(`quiz-${selectedQuiz.id}-verified`);
                      }}
                    >
                      ENTER ARENA
                    </Link>
                  )}
                </div>
              ) : (
                <button 
                  className="btn-submit" 
                  style={{width: '100%', padding: '1rem', fontSize: '1.1rem'}}
                  onClick={() => handleRegister(selectedQuiz.id)}
                  disabled={actionLoading || !selectedQuiz.is_registration_open || selectedQuiz.remaining_seats === 0}
                >
                  {actionLoading ? 'REGISTERING...' : 
                    (!selectedQuiz.is_registration_open ? 'REGISTRATION CLOSED' : 
                    (selectedQuiz.remaining_seats === 0 ? 'QUIZ FULL' : 'REGISTER FOR QUIZ'))}
                </button>
              )}
            </div>

            <div className="drawer-section" style={{marginTop: '2rem'}}>
              <span>Instructions</span>
              <p>{selectedQuiz.rules_instructions || 'Review rules carefully.'}</p>
            </div>
          </>
          );
        })()}
      </aside>

      {showPasswordModal && (
        <div className="password-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="password-modal" style={{
            background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LockIcon size={20} /> Change Password</h2>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Enter your current password and choose a new one.
            </p>

            {passwordError && <div style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{passwordError}</div>}
            {passwordSuccess && <div style={{ color: '#51cf66', background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{passwordSuccess}</div>}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>CURRENT PASSWORD</label>
                <input
                  type="password" required placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>NEW PASSWORD</label>
                <input
                  type="password" required placeholder="At least 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password" required placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                >CANCEL</button>
                <button type="submit" disabled={passwordLoading}
                  style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd700, #d4af37)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '0.9rem', fontWeight: '700', cursor: passwordLoading ? 'wait' : 'pointer' }}
                >{passwordLoading ? 'CHANGING...' : 'CHANGE PASSWORD'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default DashboardPage;
