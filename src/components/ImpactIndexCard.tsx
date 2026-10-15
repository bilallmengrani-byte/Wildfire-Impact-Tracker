import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  HelpCircle,
  Activity,
  Wind,
  Clock,
  Compass,
  Repeat,
} from 'lucide-react';
import { ImpactIndexResult, ImpactFactor } from '../lib/scoring';

interface ImpactIndexCardProps {
  impact: ImpactIndexResult;
}

export const ImpactIndexCard: React.FC<ImpactIndexCardProps> = ({ impact }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Score styling
  const getScoreTheme = (score: number) => {
    if (score >= 61) {
      return {
        textColor: 'text-red-400',
        borderColor: 'border-red-600/70',
        bgColor: 'bg-red-950/40',
        barColor: 'bg-red-500',
        badgeBg: 'bg-red-950/80 text-red-300 border-red-700/60',
        label: 'High Potential Impact',
      };
    }
    if (score >= 31) {
      return {
        textColor: 'text-amber-400',
        borderColor: 'border-amber-600/70',
        bgColor: 'bg-amber-950/40',
        barColor: 'bg-amber-500',
        badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
        label: 'Moderate Potential Impact',
      };
    }
    return {
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-600/70',
      bgColor: 'bg-emerald-950/40',
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      label: 'Low Potential Impact',
    };
  };

  const theme = getScoreTheme(impact.score);

  const getFactorIcon = (name: string) => {
    switch (name) {
      case 'Proximity':
        return <Compass className="w-3.5 h-3.5 text-blue-400" />;
      case 'Recency':
        return <Clock className="w-3.5 h-3.5 text-orange-400" />;
      case 'Persistence':
        return <Repeat className="w-3.5 h-3.5 text-purple-400" />;
      case 'Wind Alignment':
        return <Wind className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${theme.bgColor} ${theme.borderColor}`}
    >
      {/* Top Header & Score Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${theme.badgeBg}`}
            >
              <Activity className="w-3 h-3" />
              {theme.label}
            </span>
          </div>
          {/* Label required by prompt */}
          <h4 className="text-xs font-bold text-zinc-100 leading-tight">
            Prototype Impact Index
          </h4>
          <p className="text-[10px] text-zinc-400 italic">
            experimental, not an official warning
          </p>
        </div>

        {/* Large Score Display */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${theme.textColor}`}>
              {impact.score}
            </span>
            <span className="text-xs text-zinc-400 font-mono">/ 100</span>
          </div>
        </div>
      </div>

      {/* Visual Score Gauge Bar */}
      <div className="mt-2 mb-3">
        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${theme.barColor}`}
            style={{ width: `${Math.max(4, impact.score)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono mt-1">
          <span>0 (Low)</span>
          <span>30</span>
          <span>60</span>
          <span>100 (High)</span>
        </div>
      </div>

      {/* "Why this score?" Expandable Section */}
      <div className="pt-2 border-t border-zinc-800/80">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Why this score?</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span>{isExpanded ? 'Hide breakdown' : 'View factors'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2.5 pt-2 border-t border-zinc-800/60 animate-in fade-in duration-200">
            {impact.factors.map((factor) => (
              <div
                key={factor.name}
                className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                    {getFactorIcon(factor.name)}
                    <span>{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    {factor.dataUnavailable ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                        data unavailable
                      </span>
                    ) : (
                      <span
                        className={`font-bold ${
                          factor.contribution > 0 ? theme.textColor : 'text-zinc-500'
                        }`}
                      >
                        +{factor.contribution} / {factor.maxPoints} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-medium text-zinc-300">
                  {factor.value}
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-start gap-2 text-[10px] text-zinc-400 leading-tight">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Disclaimer:</strong> This is an educational tool. For emergencies, use official sources.
        </span>
      </div>
    </div>
  );
};
