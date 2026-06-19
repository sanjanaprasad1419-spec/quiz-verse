import { Link } from 'react-router-dom';
import KbcStageFx from '../KbcStageFx/KbcStageFx';
import './LandingPage.css';

const SYMBOLS = {
  triangle: '\u25B3',
  circle: '\u25CB',
  square: '\u25A1',
  sword: '\u2694',
  block: '\u25B0',
  diamond: '\u25C7',
  wave: '\u2301',
  ring: '\u25CC',
  panel: '\u25A3',
  filledTriangle: '\u25B2',
  window: '\u232C',
  dot: '\u00B7',
};

function LandingPage() {


  return (
    <main className="landing-page kbc-broadcast">
      <div className="landing-background">
        <KbcStageFx />
        <div className="bg-shape shape-pink" />
        <div className="bg-shape shape-mint" />
      </div>

      <section className="landing-hero-section">
        <div className="kbc-hero-frame" aria-hidden="true" />
        <div className="landing-container">
          <div className="landing-content">
            {/* ITM University Custom Vector Logo */}
            <div className="itm-logo-container" style={{ width: '100%', maxWidth: '300px', margin: '0 auto 0.5rem auto' }}>
              <svg 
                viewBox="0 0 450 170" 
                style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 15px rgba(229, 57, 53, 0.15))' }}
              >
                <defs>
                  <mask id="itm-stripe-mask">
                    <rect x="0" y="0" width="450" height="170" fill="#ffffff" />
                    <g stroke="#000000" strokeWidth="3">
                      <line x1="0" y1="23" x2="450" y2="23" />
                      <line x1="0" y1="31" x2="450" y2="31" />
                      <line x1="0" y1="39" x2="450" y2="39" />
                      <line x1="0" y1="47" x2="450" y2="47" />
                      <line x1="0" y1="55" x2="450" y2="55" />
                      <line x1="0" y1="63" x2="450" y2="63" />
                      <line x1="0" y1="71" x2="450" y2="71" />
                      <line x1="0" y1="79" x2="450" y2="79" />
                      <line x1="0" y1="87" x2="450" y2="87" />
                      <line x1="0" y1="95" x2="450" y2="95" />
                    </g>
                  </mask>
                </defs>

                <g stroke="#E53935" strokeWidth="1.5" opacity="0.85">
                  <line x1="60" y1="19" x2="390" y2="19" />
                  <line x1="60" y1="27" x2="390" y2="27" />
                  <line x1="60" y1="35" x2="390" y2="35" />
                  <line x1="60" y1="43" x2="390" y2="43" />
                  <line x1="60" y1="51" x2="390" y2="51" />
                  <line x1="60" y1="59" x2="390" y2="59" />
                  <line x1="60" y1="67" x2="390" y2="67" />
                  <line x1="60" y1="75" x2="390" y2="75" />
                  <line x1="60" y1="83" x2="390" y2="83" />
                  <line x1="60" y1="91" x2="390" y2="91" />
                  <line x1="60" y1="99" x2="390" y2="99" />
                </g>

                <g mask="url(#itm-stripe-mask)" fill="#E53935">
                  {/* Letter I */}
                  <rect x="85" y="15" width="32" height="88" />
                  {/* Letter T */}
                  <path d="M 155,15 L 245,15 L 245,37 L 216,37 L 216,103 L 184,103 L 184,37 L 155,37 Z" />
                  {/* Letter M */}
                  <path d="M 283,15 L 316,15 L 324,65 L 332,15 L 365,15 L 365,103 L 335,103 L 335,50 L 324,90 L 313,50 L 313,103 L 283,103 Z" />
                </g>

                <text 
                  x="225" 
                  y="126" 
                  textAnchor="middle" 
                  fill="#FFD700" 
                  fontFamily="'Montserrat', 'Arial', sans-serif" 
                  fontSize="22" 
                  fontWeight="800" 
                  letterSpacing="9"
                >
                  UNIVERSITY
                </text>

                <text 
                  x="225" 
                  y="144" 
                  textAnchor="middle" 
                  fill="#FFFFFF" 
                  fontFamily="'Arial', sans-serif" 
                  fontSize="10" 
                  fontWeight="bold" 
                  letterSpacing="5"
                  opacity="0.9"
                >
                  GWALIOR • MP • INDIA
                </text>

                <text 
                  x="225" 
                  y="162" 
                  textAnchor="middle" 
                  fill="#FFD700" 
                  fontFamily="'Georgia', serif" 
                  fontSize="11" 
                  fontStyle="italic" 
                  letterSpacing="3"
                >
                  "CELEBRATING DREAMS"
                </text>
              </svg>
            </div>

            <div className="content-badge" style={{ marginTop: '0.5rem', marginBottom: '-0.5rem' }}>
              <span className="badge-pulse" />
              ITM UNIVERSITY PRESENTS
            </div>

            <h1 className="landing-title kbc-title-shimmer" style={{ fontSize: '4.5rem', margin: '0.3rem 0 0.8rem 0' }}>QuizVerse</h1>

            <div className="landing-description">
              <p className="desc-main">
                The ultimate campus quiz arena — inspired by Kaun Banega Crorepati. Compete live, climb the ladder, claim the title.
              </p>
            </div>

            <div className="landing-actions">
              <Link to="/login" className="btn-action btn-enter">
                <span className="btn-icon">{SYMBOLS.triangle}</span>
                ENTER SYSTEM
              </Link>
            </div>

            <div className="landing-mantra" aria-label="Compete. Qualify. Conquer.">
              <span className="mantra-line mantra-compete" data-text="Compete.">Compete.</span>
              <span className="mantra-line mantra-qualify" data-text="Qualify.">Qualify.</span>
              <span className="mantra-line mantra-conquer" data-text="Conquer.">Conquer.</span>
              <div className="mantra-scan">
                <span>{SYMBOLS.triangle}</span>
                <span>{SYMBOLS.circle}</span>
                <span>{SYMBOLS.square}</span>
              </div>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}

export default LandingPage;
