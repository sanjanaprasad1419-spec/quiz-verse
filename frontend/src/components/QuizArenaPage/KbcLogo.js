import React from 'react';
import './KbcLogo.css';

export default function KbcLogo({ title }) {
  // Parsing logic
  const fullTitle = title || "Kaun Banega Crorepati";
  let mainTitle = "KAUN BANEGA";
  let goldTitle = "CROREPATI";

  const upperFull = fullTitle.toUpperCase().trim();
  if (upperFull.startsWith("KAUN BANEGA ")) {
    mainTitle = "KAUN BANEGA";
    goldTitle = upperFull.replace("KAUN BANEGA ", "");
  } else {
    mainTitle = "";
    goldTitle = upperFull;
  }

  // Calculate dynamic font-size for goldTitle to prevent overflow
  const getFontSize = (text) => {
    const len = text.length;
    if (len <= 8) return '44px';
    if (len <= 11) return '36px';
    if (len <= 14) return '30px';
    if (len <= 18) return '24px';
    return '18px';
  };

  // Generate 24 spokes for the cybernetic grid
  const spokesCount = 24;
  const spokeLines = [];
  for (let i = 0; i < spokesCount; i++) {
    const angleRad = (i * 360 / spokesCount) * Math.PI / 180;
    const x2 = 250 + 178 * Math.cos(angleRad);
    const y2 = 250 + 178 * Math.sin(angleRad);
    spokeLines.push({ x1: 250, y1: 250, x2, y2 });
  }

  // Spiral network paths (creating a complex high-tech spirograph mesh)
  const spiralPaths = [];
  const networkPoints = 16;
  for (let i = 0; i < networkPoints; i++) {
    const angle1 = (i * 360 / networkPoints) * Math.PI / 180;
    const angle2 = ((i + 5) * 360 / networkPoints) * Math.PI / 180; // offset by 5 nodes to create diagonal cross-hatching
    const x1 = 250 + 178 * Math.cos(angle1);
    const y1 = 250 + 178 * Math.sin(angle1);
    const x2 = 250 + 70 * Math.cos(angle2);
    const y2 = 250 + 70 * Math.sin(angle2);
    spiralPaths.push({ x1, y1, x2, y2 });
  }

  // Rupee symbol positions rotated perfectly around the circle (6 symbols)
  const rupeeCount = 6;
  const rupees = [];
  for (let i = 0; i < rupeeCount; i++) {
    const angleDeg = i * 60 - 90; // Start at 12 o'clock
    const angleRad = angleDeg * Math.PI / 180;
    const r = 112; // Radius inside the grid
    const x = 250 + r * Math.cos(angleRad);
    const y = 250 + r * Math.sin(angleRad);
    rupees.push({ x, y, rotation: i * 60 });
  }

  const fontSize = getFontSize(goldTitle);

  return (
    <div className="kbc-logo-wrapper">
      <svg
        className="kbc-logo-svg"
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="cyanNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="goldNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Metallic Gradients */}
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="30%" stopColor="#F1C40F" />
            <stop offset="70%" stopColor="#D68910" />
            <stop offset="100%" stopColor="#9A7D0A" />
          </linearGradient>

          <linearGradient id="silverChrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="48%" stopColor="#F2F3F4" />
            <stop offset="50%" stopColor="#BDC3C7" />
            <stop offset="52%" stopColor="#7F8C8D" />
            <stop offset="100%" stopColor="#EAEDED" />
          </linearGradient>

          <linearGradient id="outerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c0c5b" />
            <stop offset="50%" stopColor="#140530" />
            <stop offset="100%" stopColor="#0a021c" />
          </linearGradient>

          <radialGradient id="centerBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#152b6d" />
            <stop offset="70%" stopColor="#050a21" />
            <stop offset="100%" stopColor="#020410" />
          </radialGradient>
          
          {/* Curved Text Paths (Left to Right) */}
          {/* Top text path curves clockwise over the top */}
          <path id="topTextPath" d="M 60,250 A 190,190 0 0,1 440,250" fill="none" />
          {/* Bottom text path curves clockwise under the bottom */}
          <path id="bottomTextPath" d="M 60,250 A 190,190 0 0,0 440,250" fill="none" />
        </defs>

        {/* 1. Base Center Background */}
        <circle cx="250" cy="250" r="240" fill="url(#centerBg)" />

        {/* 2. Cybernetic Web / Spirograph Grid (Cyan Neon Glow) */}
        <g className="cyber-grid" stroke="#00f0ff" strokeWidth="0.7" opacity="0.45">
          {/* Concentric circles */}
          <circle cx="250" cy="250" r="40" fill="none" strokeDasharray="2,2" />
          <circle cx="250" cy="250" r="70" fill="none" />
          <circle cx="250" cy="250" r="100" fill="none" strokeDasharray="4,2" />
          <circle cx="250" cy="250" r="130" fill="none" />
          <circle cx="250" cy="250" r="160" fill="none" />
          
          {/* Spoke lines */}
          {spokeLines.map((line, index) => (
            <line key={`spoke-${index}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}

          {/* Diagonal spiral lattice */}
          {spiralPaths.map((line, index) => (
            <line key={`spiral-${index}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} opacity="0.3" strokeWidth="0.5" />
          ))}
        </g>

        {/* 3. Golden Rupee Symbol Ring with Neon Back-Glow */}
        <g className="rupee-ring">
          {/* Back glows */}
          {rupees.map((r, i) => (
            <g key={`rupee-glow-${i}`} transform={`translate(${r.x}, ${r.y}) rotate(${r.rotation}) scale(1.6) translate(-12, -12)`}>
              <path
                d="M19.5 5h-15v2h6.09c-0.65 0.53-1.22 1.15-1.68 1.85H4.5v2h3.58c0.16 0.25 0.34 0.49 0.54 0.72H4.5v2h6.07c1.17 1.82 3.19 3 5.43 3h1v-2h-1c-1.74 0-3.32-0.96-4.14-2.5h5.14v-2H10.42c0.05-0.12 0.1-0.24 0.14-0.36H19.5v-2h-8.94c0.46-0.7 1.03-1.32 1.68-1.85H19.5V5z"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="5"
                filter="url(#cyanNeonGlow)"
                opacity="0.8"
              />
            </g>
          ))}

          {/* Foreground Gold Rupee symbols */}
          {rupees.map((r, i) => (
            <g key={`rupee-fg-${i}`} transform={`translate(${r.x}, ${r.y}) rotate(${r.rotation}) scale(1.6) translate(-12, -12)`}>
              <path
                d="M19.5 5h-15v2h6.09c-0.65 0.53-1.22 1.15-1.68 1.85H4.5v2h3.58c0.16 0.25 0.34 0.49 0.54 0.72H4.5v2h6.07c1.17 1.82 3.19 3 5.43 3h1v-2h-1c-1.74 0-3.32-0.96-4.14-2.5h5.14v-2H10.42c0.05-0.12 0.1-0.24 0.14-0.36H19.5v-2h-8.94c0.46-0.7 1.03-1.32 1.68-1.85H19.5V5z"
                fill="url(#goldMetallic)"
                stroke="#050a21"
                strokeWidth="1.2"
              />
            </g>
          ))}
        </g>

        {/* 4. Outer Purple Thick Ring & Curved Text */}
        <g className="outer-ring">
          {/* The thick ring itself */}
          <path
            d="M 250,10 A 240,240 0 1,0 250,490 A 240,240 0 1,0 250,10 M 250,65 A 185,185 0 1,1 250,435 A 185,185 0 1,1 250,65"
            fill="url(#outerRingGrad)"
            stroke="#00f0ff"
            strokeWidth="2.5"
            filter="url(#cyanNeonGlow)"
          />
          
          {/* Inner neon border ring */}
          <circle cx="250" cy="250" r="185" fill="none" stroke="#00f0ff" strokeWidth="1.5" />
          
          {/* Gold Accent Ring Lines */}
          <circle cx="250" cy="250" r="232" fill="none" stroke="url(#goldMetallic)" strokeWidth="0.8" opacity="0.7" />
          <circle cx="250" cy="250" r="193" fill="none" stroke="url(#goldMetallic)" strokeWidth="0.8" opacity="0.7" />

          {/* Curved Text - Top: "KAUN BANEGA" */}
          {mainTitle && (
            <text fill="#ffffff" fontFamily="'Outfit', 'Inter', sans-serif" fontWeight="900" fontSize="25px" letterSpacing="4px">
              <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                {mainTitle}
              </textPath>
            </text>
          )}

          {/* Curved Text - Bottom: "KAUN BANEGA" */}
          {mainTitle && (
            <text fill="#ffffff" fontFamily="'Outfit', 'Inter', sans-serif" fontWeight="900" fontSize="25px" letterSpacing="4px">
              <textPath href="#bottomTextPath" startOffset="50%" text-anchor="middle">
                {mainTitle}
              </textPath>
            </text>
          )}

          {/* Gold Diamond Accents at 9 o'clock and 3 o'clock */}
          {/* Left Diamond */}
          <polygon points="56,242 64,250 56,258 48,250" fill="url(#goldMetallic)" stroke="#050a21" strokeWidth="1.5" />
          {/* Right Diamond */}
          <polygon points="444,242 452,250 444,258 436,250" fill="url(#goldMetallic)" stroke="#050a21" strokeWidth="1.5" />
        </g>

        {/* 5. Centerpiece Dynamic Text Layer (Chrome/Metallic 3D) */}
        <g className="center-title-badge">
          {/* Horizontal dark glowing backdrop strip */}
          <rect x="70" y="210" width="360" height="80" rx="10" fill="#020514" stroke="#00f0ff" strokeWidth="1.5" opacity="0.85" filter="url(#cyanNeonGlow)" />
          <rect x="75" y="215" width="350" height="70" rx="8" fill="none" stroke="url(#goldMetallic)" strokeWidth="1" opacity="0.6" />

          {/* Layer 1: Ambient Cyan neon glow behind text */}
          <text
            x="250"
            y="266"
            fontFamily="'Outfit', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize={fontSize}
            textAnchor="middle"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="8"
            filter="url(#cyanNeonGlow)"
            opacity="0.9"
            textLength={goldTitle.length > 8 ? "330" : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {goldTitle}
          </text>

          {/* Layer 2: Extra thick dark background stroke to block out the grid */}
          <text
            x="250"
            y="266"
            fontFamily="'Outfit', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize={fontSize}
            textAnchor="middle"
            fill="#020514"
            stroke="#020514"
            strokeWidth="10"
            strokeLinejoin="round"
            textLength={goldTitle.length > 8 ? "330" : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {goldTitle}
          </text>

          {/* Layer 3: Gold Border/Trim behind chrome */}
          <text
            x="250"
            y="266"
            fontFamily="'Outfit', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize={fontSize}
            textAnchor="middle"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="4"
            strokeLinejoin="round"
            textLength={goldTitle.length > 8 ? "330" : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {goldTitle}
          </text>

          {/* Layer 4: Chrome/Silver fill with clean dark stroke */}
          <text
            x="250"
            y="266"
            fontFamily="'Outfit', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize={fontSize}
            textAnchor="middle"
            fill="url(#silverChrome)"
            stroke="#020514"
            strokeWidth="1"
            strokeLinejoin="round"
            textLength={goldTitle.length > 8 ? "330" : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {goldTitle}
          </text>
        </g>
      </svg>
    </div>
  );
}
