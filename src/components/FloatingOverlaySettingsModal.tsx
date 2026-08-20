import React from 'react';
import {
  Battery,
  BatteryCharging,
  Check,
  Eye,
  Layers,
  Move,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
  X,
} from 'lucide-react';
import { FloatingOverlayConfig } from '../types/game';

interface FloatingOverlaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FloatingOverlayConfig;
  onUpdateConfig: (partial: Partial<FloatingOverlayConfig>) => void;
  onRequestOverlayPermission: () => void;
}

export const FloatingOverlaySettingsModal: React.FC<FloatingOverlaySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onRequestOverlayPermission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Floating Analyzer Settings</h3>
              <p className="text-slate-400 text-xs">
                Configure Android WindowManager overlay preferences & visibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Permission Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">System Overlay Permission</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  config.hasOverlayPermission
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {config.hasOverlayPermission ? 'PERMISSION: ON' : 'PERMISSION: OFF'}
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Requires Android <code className="text-emerald-400">SYSTEM_ALERT_WINDOW</code> permission ("Display over other apps") to float over Boomplay.
            </p>
            <button
              onClick={onRequestOverlayPermission}
              className={`w-full py-2 rounded-lg font-bold text-xs transition-colors ${
                config.hasOverlayPermission
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md'
              }`}
            >
              {config.hasOverlayPermission ? 'Re-verify Permission in Settings' : 'ENABLE FLOATING ANALYZER (Grant Permission)'}
            </button>
          </div>

          {/* Opacity Control */}
          <div className="space-y-2">
            <label className="text-white font-semibold flex items-center justify-between">
              <span>Overlay Opacity (Transparency)</span>
              <span className="font-mono text-emerald-400 font-bold">{config.opacity}%</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([100, 80, 60, 40] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => onUpdateConfig({ opacity: op })}
                  className={`py-2 rounded-lg font-mono font-bold text-xs border transition-colors ${
                    config.opacity === op
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {op}% {op === 80 && '(Default)'}
                </button>
              ))}
            </div>
          </div>

          {/* Size Control */}
          <div className="space-y-2">
            <label className="text-white font-semibold">Overlay Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'normal', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onUpdateConfig({ size: sz })}
                  className={`py-2 rounded-lg capitalize font-medium text-xs border transition-colors ${
                    config.size === sz
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Battery / Performance Mode */}
          <div className="space-y-2">
            <label className="text-white font-semibold flex items-center justify-between">
              <span>Battery & Processing Mode</span>
              <span className="text-[10px] text-slate-400">Intelligent FPS throttling</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateConfig({ batteryMode: 'NORMAL' })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  config.batteryMode === 'NORMAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">NORMAL MODE</div>
                <div className="text-[10px] text-slate-400 mt-0.5">High frequency (15-20 FPS) on transitions</div>
              </button>

              <button
                onClick={() => onUpdateConfig({ batteryMode: 'LOW_POWER' })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  config.batteryMode === 'LOW_POWER'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">LOW POWER (ECO)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Adaptive 2-5 FPS during countdown idle</div>
              </button>
            </div>
          </div>

          {/* Visibility Checkboxes */}
          <div className="space-y-2">
            <label className="text-white font-semibold">Overlay Information Elements</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCountdown}
                  onChange={(e) => onUpdateConfig({ showCountdown: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Countdown Timer</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showRound}
                  onChange={(e) => onUpdateConfig({ showRound: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Round ID</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showPrediction}
                  onChange={(e) => onUpdateConfig({ showPrediction: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Top Model Pick</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTop3}
                  onChange={(e) => onUpdateConfig({ showTop3: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Top 3 Candidates</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showScore}
                  onChange={(e) => onUpdateConfig({ showScore: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Model Scores</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showConfidence}
                  onChange={(e) => onUpdateConfig({ showConfidence: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Recognition Conf.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showLiveRounds}
                  onChange={(e) => onUpdateConfig({ showLiveRounds: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-slate-300">Live Rounds Total</span>
              </label>
            </div>
          </div>

          {/* Sound & Vibration Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                config.soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="font-semibold text-xs text-white">Audio Alerts</span>
              </div>
              <span className="font-bold text-[10px]">{config.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ vibrationEnabled: !config.vibrationEnabled })}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                config.vibrationEnabled
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4" />
                <span className="font-semibold text-xs text-white">Haptic Vibration</span>
              </div>
              <span className="font-bold text-[10px]">{config.vibrationEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors"
          >
            Done & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
