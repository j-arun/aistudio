import React from 'react';
import { DivisionalChart, DivisionalChartId } from '../types';
import { SIGN_NAMES, GRAHA_COORDINATES } from '../data/canonicalHoroscope';
import { Sparkles, Compass, Shield } from 'lucide-react';

interface SouthIndianChartProps {
  chart: DivisionalChart;
  onSelectDivisional: (id: DivisionalChartId) => void;
  selectedChartId: DivisionalChartId;
}

// Fixed 4x4 Grid layout coordinates for South Indian Chart
// [row, col] -> sign index (0: Mesham, 1: Rishabam, ..., 11: Meenam)
const GRID_CELLS: { row: number; col: number; signIndex: number }[] = [
  // Row 0
  { row: 0, col: 0, signIndex: 11 }, // Meenam (Pisces)
  { row: 0, col: 1, signIndex: 0 },  // Mesham (Aries)
  { row: 0, col: 2, signIndex: 1 },  // Rishabam (Taurus)
  { row: 0, col: 3, signIndex: 2 },  // Mithunam (Gemini)

  // Row 1
  { row: 1, col: 0, signIndex: 10 }, // Kumbam (Aquarius)
  // [1, 1] & [1, 2] is Center Box
  { row: 1, col: 3, signIndex: 3 },  // Kadagam (Cancer)

  // Row 2
  { row: 2, col: 0, signIndex: 9 },  // Makaram (Capricorn)
  // [2, 1] & [2, 2] is Center Box
  { row: 2, col: 3, signIndex: 4 },  // Simham (Leo)

  // Row 3
  { row: 3, col: 0, signIndex: 8 },  // Dhanusu (Sagittarius)
  { row: 3, col: 1, signIndex: 7 },  // Vrichigam (Scorpio)
  { row: 3, col: 2, signIndex: 6 },  // Thulam (Libra)
  { row: 3, col: 3, signIndex: 5 },  // Kanni (Virgo)
];

export const SouthIndianChart: React.FC<SouthIndianChartProps> = ({
  chart,
  onSelectDivisional,
  selectedChartId,
}) => {
  // Compute house number relative to chart lagna (1..12)
  const getHouseNumber = (signIdx: number): number => {
    const lagnaIdx = chart.lagnaSignIndex;
    return ((signIdx - lagnaIdx + 12) % 12) + 1;
  };

  const getCellForSign = (signIdx: number) => {
    return GRID_CELLS.find((cell) => cell.signIndex === signIdx);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Canvas Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 4x4 South Indian Grid */}
        <div className="aspect-square w-full max-w-[620px] mx-auto grid grid-cols-4 grid-rows-4 border-2 border-amber-600/70 bg-slate-950 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)] relative">
          {/* Render the 12 Perimeter Boxes */}
          {GRID_CELLS.map((cell) => {
            const sign = SIGN_NAMES[cell.signIndex];
            const planets = chart.placements[cell.signIndex] || [];
            const houseNum = getHouseNumber(cell.signIndex);
            const isLagnaSign = cell.signIndex === chart.lagnaSignIndex;

            // Grid positioning classes based on row and col
            const positionStyle = {
              gridRowStart: cell.row + 1,
              gridColumnStart: cell.col + 1,
            };

            return (
              <div
                key={cell.signIndex}
                style={positionStyle}
                className={`border border-amber-800/40 p-1.5 sm:p-2.5 flex flex-col justify-between transition-colors relative group select-none ${
                  isLagnaSign
                    ? 'bg-amber-950/40 shadow-inner'
                    : 'bg-slate-950/80 hover:bg-slate-900/90'
                }`}
              >
                {/* Top header of sign box: House Number & Tamil Sign Name */}
                <div className="flex items-center justify-between border-b border-amber-900/30 pb-1 text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold tracking-wider">
                      {sign.tamilName}
                    </span>
                    <span className="text-slate-500 text-[9px] hidden sm:inline">
                      ({sign.name})
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-semibold ${
                      isLagnaSign
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-amber-400/80 bg-slate-900 border border-amber-900/40'
                    }`}
                  >
                    H{houseNum}
                  </span>
                </div>

                {/* Planets placed in this house */}
                <div className="flex-1 flex flex-col justify-center py-1 gap-1">
                  {planets.length === 0 ? (
                    <div className="text-center text-slate-700 text-xs font-mono select-none">
                      —
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 items-center justify-center">
                      {planets.map((planetStr, idx) => {
                        const isRetro = planetStr.includes('(வ)') || planetStr.includes('(R)');
                        const isLagna = planetStr.includes('லக்னம்') || planetStr.includes('Asc');
                        const isMandi = planetStr.includes('மா');

                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium border font-mono tracking-tight ${
                              isLagna
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold ring-1 ring-amber-400/30'
                                : isRetro
                                ? 'bg-red-950/70 text-red-300 border-red-700/60 font-semibold'
                                : isMandi
                                ? 'bg-purple-950/60 text-purple-300 border-purple-700/50'
                                : 'bg-slate-900/90 text-amber-100 border-amber-700/40'
                            }`}
                          >
                            <span>{planetStr}</span>
                            {isRetro && (
                              <span className="text-[9px] text-red-400 font-bold ml-0.5" title="Retrograde (வக்ரம்)">
                                R
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sign ruler footer */}
                <div className="text-[9px] text-slate-500 flex items-center justify-between border-t border-amber-900/20 pt-0.5">
                  <span className="font-mono text-[9px] text-slate-500">{sign.symbol}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 truncate">{sign.ruler}</span>
                </div>
              </div>
            );
          })}

          {/* Center 2x2 Box: Occupies Grid Rows 2-3, Cols 2-3 */}
          <div
            style={{
              gridRowStart: 2,
              gridRowEnd: 4,
              gridColumnStart: 2,
              gridColumnEnd: 4,
            }}
            className="border-2 border-amber-600/80 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 p-3 sm:p-4 flex flex-col justify-between items-center text-center relative shadow-inner"
          >
            {/* Corner Ornamental Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-amber-500/70" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-amber-500/70" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-amber-500/70" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-amber-500/70" />

            <div className="w-full">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold mb-1 font-mono">
                <Compass className="w-3 h-3 text-amber-400" />
                South Indian Format • தென்னிந்திய முறை
              </div>

              <h2 className="text-sm sm:text-lg font-bold text-amber-200 tracking-tight font-sans">
                {chart.name} ({chart.id})
              </h2>
              <div className="text-xs text-amber-400 font-medium">{chart.tamilName}</div>
            </div>

            <div className="my-1.5 p-2 rounded-lg bg-slate-900/80 border border-amber-900/30 w-full text-left">
              <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                BPHS Focus Area
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {chart.bphsFocus}
              </p>
            </div>

            <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-amber-900/30 pt-1.5">
              <span>
                Lagna:{' '}
                <strong className="text-amber-300">
                  {SIGN_NAMES[chart.lagnaSignIndex].tamilName} ({SIGN_NAMES[chart.lagnaSignIndex].name})
                </strong>
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
