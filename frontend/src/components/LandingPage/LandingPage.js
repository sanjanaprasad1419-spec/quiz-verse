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
            <div className="content-badge">
              <span className="badge-pulse" />
              ROUND ACCESS NOW OPEN
            </div>

            <h1 className="landing-title kbc-title-shimmer">QuizVerse</h1>

            <div className="landing-description">
              <p className="desc-main">
                The ultimate campus quiz arena — inspired by Kaun Banega Codepati. Compete live, climb the ladder, claim the title.
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
