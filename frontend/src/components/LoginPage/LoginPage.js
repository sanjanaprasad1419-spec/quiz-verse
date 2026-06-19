import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStudent, saveAuthSession } from '../../api/auth';
import KbcStageFx from '../KbcStageFx/KbcStageFx';
import './LoginPage.css';

function LoginPage() {
  const [loginData, setLoginData] = useState({ collegeId: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError('');
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const session = await loginStudent({
        identifier: loginData.collegeId || loginData.email,
        password: loginData.password,
      });

      saveAuthSession(session);

      if (session.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (requestError) {
      const detail = requestError.data || {};
      const message =
        detail.detail ||
        detail.message ||
        Object.values(detail).flat().join(' ') ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page kbc-broadcast">
      <div className="login-background">
        <KbcStageFx />
      </div>

      <div className="login-container kbc-frame-panel">
        <div className="login-header">
          <div className="header-icon">₹</div>
          <h1 className="login-title kbc-title-shimmer">Player Access</h1>
          <p className="login-subtitle">Enter your credentials to resume your run in the arena.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="collegeId">COLLEGE ID</label>
            <input
              id="collegeId"
              name="collegeId"
              type="text"
              placeholder="e.g. 123456"
              value={loginData.collegeId}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">STUDENT EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="player@university.edu"
              value={loginData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={loginData.password}
                onChange={handleChange}
                required
                style={{ paddingRight: '3.5rem', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--kbc-gold)',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'VERIFYING...' : 'VERIFY IDENTITY'}
            </button>
          </div>
        </form>


      </div>
    </main>
  );
}

export default LoginPage;
