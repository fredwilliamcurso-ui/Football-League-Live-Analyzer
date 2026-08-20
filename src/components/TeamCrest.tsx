import React from 'react';
import { TeamId, TEAMS } from '../types/game';

interface TeamCrestProps {
  teamId: TeamId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showMultiplier?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-20 h-20 text-lg',
  '2xl': 'w-28 h-28 text-xl',
};

export const TeamCrest: React.FC<TeamCrestProps> = ({
  teamId,
  size = 'md',
  showMultiplier = false,
  className = '',
}) => {
  const team = TEAMS[teamId];

  // Specific high-fidelity SVG crest representations for the 8 teams
  const renderCrestSvg = () => {
    switch (teamId) {
      case 'real_madrid':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Real Madrid: Golden Crown + White Circle with Gold & Purple diagonal sash */}
            <circle cx="50" cy="54" r="38" fill="#FFFFFF" stroke="#EEB82C" strokeWidth="4" />
            <path d="M22 36 L78 72" stroke="#472B74" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
            {/* Inner monogram styling */}
            <circle cx="50" cy="54" r="26" fill="none" stroke="#EEB82C" strokeWidth="2.5" />
            <text x="50" y="58" textAnchor="middle" fill="#472B74" fontWeight="900" fontSize="18" fontFamily="serif">MCF</text>
            {/* Crown on top */}
            <path d="M30 20 L36 10 L44 18 L50 6 L56 18 L64 10 L70 20 Z" fill="#EEB82C" stroke="#A67C00" strokeWidth="1" />
            <circle cx="50" cy="4" r="2.5" fill="#EEB82C" />
            <circle cx="36" cy="9" r="1.5" fill="#E11D48" />
            <circle cx="50" cy="8" r="1.5" fill="#2563EB" />
            <circle cx="64" cy="9" r="1.5" fill="#E11D48" />
          </svg>
        );

      case 'barcelona':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Barcelona: Shield with St George cross, Catalan Senyera, and Blaugrana stripes */}
            <path
              d="M50 8 C75 8, 85 20, 85 45 C85 75, 50 94, 50 94 C50 94, 15 75, 15 45 C15 20, 25 8, 50 8 Z"
              fill="#004D98"
              stroke="#EDBB00"
              strokeWidth="3.5"
            />
            {/* Upper half background */}
            <path d="M18 42 L82 42 L82 25 C82 15 70 11 50 11 C30 11 18 15 18 25 Z" fill="#FFFFFF" />
            {/* Left upper: St George Red Cross */}
            <rect x="30" y="12" width="6" height="28" fill="#DB0030" />
            <rect x="19" y="23" width="28" height="6" fill="#DB0030" />
            {/* Right upper: Senyera Red/Yellow stripes */}
            <rect x="52" y="12" width="6" height="28" fill="#EDBB00" />
            <rect x="58" y="12" width="6" height="28" fill="#DB0030" />
            <rect x="64" y="12" width="6" height="28" fill="#EDBB00" />
            <rect x="70" y="12" width="6" height="28" fill="#DB0030" />
            <rect x="76" y="12" width="6" height="28" fill="#EDBB00" />
            {/* Middle gold band with FCB */}
            <rect x="16" y="40" width="68" height="12" fill="#EDBB00" />
            <text x="50" y="49" textAnchor="middle" fill="#000000" fontWeight="900" fontSize="8" fontFamily="sans-serif">F.C.B.</text>
            {/* Lower half Blaugrana stripes */}
            <path d="M22 52 L35 52 L35 78 C30 72 25 64 22 52 Z" fill="#A50044" />
            <path d="M35 52 L50 52 L50 88 C44 84 39 80 35 75 Z" fill="#004D98" />
            <path d="M50 52 L65 52 L65 75 C61 80 56 84 50 88 Z" fill="#A50044" />
            <path d="M65 52 L78 52 C75 64 70 72 65 78 Z" fill="#004D98" />
            {/* Football at bottom center */}
            <circle cx="50" cy="68" r="8" fill="#F8FAFC" stroke="#000000" strokeWidth="1" />
            <path d="M48 64 L52 64 L54 68 L50 71 L46 68 Z" fill="#000000" />
          </svg>
        );

      case 'psg':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* PSG: Circular badge with Eiffel tower and Fleur-de-lis */}
            <circle cx="50" cy="50" r="45" fill="#004170" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#DA291C" strokeWidth="2" />
            {/* Text ring */}
            <text x="50" y="24" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10" letterSpacing="1">PARIS</text>
            <text x="50" y="85" textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="7" letterSpacing="1">SAINT-GERMAIN</text>
            {/* Central white inner circle */}
            <circle cx="50" cy="50" r="23" fill="#FFFFFF" />
            {/* Red Eiffel Tower */}
            <path d="M50 30 L45 62 L55 62 Z" fill="#DA291C" />
            <path d="M42 62 L58 62 L54 54 L46 54 Z" fill="#DA291C" />
            <path d="M47 50 L53 50 L53 46 L47 46 Z" fill="#DA291C" />
            <path d="M46 62 Q50 56 54 62 Z" fill="#FFFFFF" />
            {/* Golden Fleur de Lis below */}
            <path d="M50 57 C48 55, 46 58, 50 64 C54 58, 52 55, 50 57 Z" fill="#DAA520" />
          </svg>
        );

      case 'liverpool':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Liverpool: Red Shield + Shankly Gates & Liverbird */}
            <path
              d="M50 18 C72 18, 80 26, 80 50 C80 76, 50 94, 50 94 C50 94, 20 76, 20 50 C20 26, 28 18, 50 18 Z"
              fill="#C8102E"
              stroke="#00B2A9"
              strokeWidth="3.5"
            />
            {/* Shankly gates ornamentation on top */}
            <path d="M26 18 C35 8, 65 8, 74 18 Z" fill="#00B2A9" />
            <text x="50" y="15" textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="4.5">YOU'LL NEVER WALK ALONE</text>
            {/* Liverbird */}
            <path
              d="M50 35 C53 33, 56 36, 54 40 C52 44, 58 50, 56 60 C54 68, 50 72, 46 75 C44 72, 45 66, 44 60 C42 54, 46 45, 48 40 C46 36, 48 34, 50 35 Z"
              fill="#FFFFFF"
            />
            {/* Wings and seaweed */}
            <path d="M54 44 C62 46, 64 54, 58 56 C54 52, 54 48, 54 44 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M46 44 C38 46, 36 54, 42 56 C46 52, 46 48, 46 44 Z" fill="#FFFFFF" opacity="0.9" />
            <text x="50" y="84" textAnchor="middle" fill="#F6EB61" fontWeight="800" fontSize="8" fontFamily="serif">L.F.C.</text>
          </svg>
        );

      case 'ac_milan':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* AC Milan: Vertical Oval Shield with Red/Black stripes & Red Cross */}
            <ellipse cx="50" cy="50" rx="34" ry="44" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
            {/* Top banner with ACM */}
            <path d="M22 28 C28 14, 72 14, 78 28 Z" fill="#000000" />
            <text x="50" y="24" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="10" letterSpacing="1">ACM</text>
            {/* Bottom year */}
            <path d="M22 72 C28 86, 72 86, 78 72 Z" fill="#000000" />
            <text x="50" y="81" textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="8">1899</text>
            {/* Inner oval split in two halves */}
            <g clipPath="url(#acmClip)">
              {/* Left half: Red & Black vertical stripes */}
              <rect x="20" y="28" width="6" height="44" fill="#000000" />
              <rect x="26" y="28" width="6" height="44" fill="#FB090B" />
              <rect x="32" y="28" width="6" height="44" fill="#000000" />
              <rect x="38" y="28" width="6" height="44" fill="#FB090B" />
              <rect x="44" y="28" width="6" height="44" fill="#000000" />
              {/* Right half: St Ambrose Red Cross on White */}
              <rect x="50" y="28" width="30" height="44" fill="#FFFFFF" />
              <rect x="62" y="28" width="6" height="44" fill="#FB090B" />
              <rect x="50" y="47" width="30" height="6" fill="#FB090B" />
            </g>
            <ellipse cx="50" cy="50" rx="30" ry="38" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
            <defs>
              <clipPath id="acmClip">
                <ellipse cx="50" cy="50" rx="30" ry="22" />
              </clipPath>
            </defs>
          </svg>
        );

      case 'bayern':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Bayern Munich: Red outer circle with FC BAYERN MÜNCHEN + Bavarian blue/white diamonds */}
            <circle cx="50" cy="50" r="45" fill="#DC052D" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="30" fill="#0066B2" stroke="#FFFFFF" strokeWidth="2" />
            {/* Bavarian Diamonds Pattern in Center */}
            <g clipPath="url(#bayernCenter)">
              <rect x="20" y="20" width="60" height="60" fill="#0066B2" />
              <path d="M20 20 L80 80 M10 40 L70 100 M30 0 L90 60 M0 20 L80 100" stroke="#FFFFFF" strokeWidth="7" />
            </g>
            {/* Text ring */}
            <text x="50" y="18" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="7" letterSpacing="0.5">FC BAYERN</text>
            <text x="50" y="90" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="6.5" letterSpacing="0.5">MÜNCHEN</text>
            <defs>
              <clipPath id="bayernCenter">
                <circle cx="50" cy="50" r="23" />
              </clipPath>
            </defs>
          </svg>
        );

      case 'juventus':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Juventus: Modern iconic Black & White 'J' shield with 3 gold stars */}
            <rect x="15" y="15" width="70" height="75" rx="14" fill="#000000" />
            {/* Three Gold Stars */}
            <polygon points="34,8 36,13 41,13 37,16 39,21 34,18 29,21 31,16 27,13 32,13" fill="#D1A153" />
            <polygon points="50,8 52,13 57,13 53,16 55,21 50,18 45,21 47,16 43,13 48,13" fill="#D1A153" />
            <polygon points="66,8 68,13 73,13 69,16 71,21 66,18 61,21 63,16 59,13 64,13" fill="#D1A153" />
            {/* White J Stripe Silhouette */}
            <path
              d="M32 28 L46 28 L46 62 C46 72 38 78 28 78 L26 68 C32 68 35 64 35 58 L35 28 Z"
              fill="#FFFFFF"
            />
            <path
              d="M54 28 L68 28 L68 62 C68 76 56 82 44 82 L42 72 C50 72 56 68 56 58 L56 28 Z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'man_utd':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Manchester United: Red & Yellow circular crest with Red Devil & Golden Ship */}
            <circle cx="50" cy="50" r="44" fill="#DA291C" stroke="#FBE122" strokeWidth="3" />
            {/* Yellow banners */}
            <path d="M22 28 C30 18, 70 18, 78 28 Z" fill="#FBE122" />
            <text x="50" y="24" textAnchor="middle" fill="#000000" fontWeight="900" fontSize="6.5">MANCHESTER</text>
            <path d="M22 72 C30 82, 70 82, 78 72 Z" fill="#FBE122" />
            <text x="50" y="80" textAnchor="middle" fill="#000000" fontWeight="900" fontSize="7">UNITED</text>
            {/* Center shield */}
            <path d="M35 34 L65 34 L65 58 C65 66 50 70 50 70 C50 70 35 66 35 58 Z" fill="#FBE122" stroke="#000000" strokeWidth="1" />
            {/* Golden Ship on top of shield */}
            <path d="M40 40 L60 40 L56 46 L44 46 Z" fill="#DA291C" />
            <polygon points="50,35 55,39 45,39" fill="#000000" />
            {/* Red Devil in bottom of shield */}
            <circle cx="50" cy="54" r="5" fill="#DA291C" />
            {/* Devil Pitchfork */}
            <path d="M42 50 L58 50 M44 56 L47 50 M56 56 L53 50 M50 50 L50 64" stroke="#DA291C" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  const getMultiplierBadgeColor = (multiplier: number) => {
    switch (multiplier) {
      case 40:
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-300';
      case 12:
        return 'bg-gradient-to-r from-rose-600 to-pink-500 text-white border-rose-400';
      case 6:
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-400';
      case 4:
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-blue-400';
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center transition-transform hover:scale-105`}>
        {renderCrestSvg()}
      </div>
      {showMultiplier && (
        <span
          className={`mt-1 font-black px-1.5 py-0.5 rounded-full text-[10px] tracking-tight uppercase shadow-xs border ${getMultiplierBadgeColor(
            team.multiplier
          )}`}
        >
          X{team.multiplier}
        </span>
      )}
    </div>
  );
};
