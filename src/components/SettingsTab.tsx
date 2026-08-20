import React, { useState } from 'react';
import {
  Code2,
  Database,
  Download,
  FileSpreadsheet,
  Layers,
  Lock,
  RotateCcw,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { soundService } from '../notifications/audioAlerts';
import { DEFAULT_WEIGHTS } from '../prediction/predictionEngine';
import { CalibrationProfile, RoundResult } from '../types/game';
import { DEFAULT_CALIBRATION_720X1600 } from '../vision/visionEngine';
import { AndroidCodeModal } from './AndroidCodeModal';

interface SettingsTabProps {
  calibration: CalibrationProfile;
  onUpdateCalibration: (newCalibration: CalibrationProfile) => void;
  onResetSeed: () => void;
  onClearAll: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  overlayConfig?: any;
  onUpdateOverlayConfig?: (partial: any) => void;
  onStartMonitoring?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  calibration,
  onUpdateCalibration,
  onResetSeed,
  onClearAll,
  onExportCSV,
  onExportJSON,
  overlayConfig,
  onUpdateOverlayConfig,
  onStartMonitoring,
}) => {
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'720x1600' | '1080x2400' | 'CUSTOM'>('720x1600');
  const [soundEnabled, setSoundEnabled] = useState(soundService.getEnabled());
  const [overlayPermGranted, setOverlayPermGranted] = useState(overlayConfig?.hasOverlayPermission ?? true);

  const handleToggleOverlayPermission = () => {
    const next = !overlayPermGranted;
    setOverlayPermGranted(next);
    if (onUpdateOverlayConfig) {
      onUpdateOverlayConfig({ hasOverlayPermission: next });
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setEnabled(next);
  };

  const handleTestChime = () => {
    soundService.playPredictionReady();
  };

  const handleResetCalibration = () => {
    onUpdateCalibration(DEFAULT_CALIBRATION_720X1600);
    setSelectedPreset('720x1600');
  };

  const handleUpdateRegion = (
    key: 'countdownArea' | 'roundNumberArea' | 'resultPopupArea' | 'stateBannerArea',
    field: 'x' | 'y' | 'width' | 'height',
    value: number
  ) => {
    onUpdateCalibration({
      ...calibration,
      [key]: {
        ...calibration[key],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-base">Application & Computer Vision Settings</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configure screen capture parameters, detection bounding boxes, audio alerts, and review locked production model parameters.
          </p>
        </div>

        <button
          id="settings-btn-open-android-code"
          onClick={() => setIsAndroidModalOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-xs"
        >
          <Code2 className="w-4 h-4" />
          View Android Kotlin Files
        </button>
      </div>

      {/* Production Model Lock Banner (Mandatory Protocol) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/40 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm sm:text-base uppercase tracking-wider">
                  PRODUCTION MODEL: LOCKED
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  VALIDATION PHASE ACTIVE
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Model tuning and automated weight modification are strictly disabled during the live data collection benchmark.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              AUTOMATIC BETTING: <strong className="text-rose-400">DISABLED</strong>
            </span>
          </div>
        </div>

        {/* Locked Weights Display */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] flex items-center justify-between">
              Recent Freq <Lock className="w-3 h-3 text-slate-500" />
            </span>
            <span className="text-emerald-400 font-bold text-sm mt-1">{DEFAULT_WEIGHTS.recentFrequency * 100}%</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] flex items-center justify-between">
              Gap Signal <Lock className="w-3 h-3 text-slate-500" />
            </span>
            <span className="text-emerald-400 font-bold text-sm mt-1">{DEFAULT_WEIGHTS.gap * 100}%</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] flex items-center justify-between">
              Markov Transition <Lock className="w-3 h-3 text-slate-500" />
            </span>
            <span className="text-purple-400 font-bold text-sm mt-1">{DEFAULT_WEIGHTS.markovTransition * 100}%</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] flex items-center justify-between">
              Streak Adj. <Lock className="w-3 h-3 text-slate-500" />
            </span>
            <span className="text-blue-400 font-bold text-sm mt-1">{DEFAULT_WEIGHTS.streak * 100}%</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] flex items-center justify-between">
              Multiplier Tier <Lock className="w-3 h-3 text-slate-500" />
            </span>
            <span className="text-amber-400 font-bold text-sm mt-1">{DEFAULT_WEIGHTS.multiplierTier * 100}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Calibration Profiles & ROI Bounding Boxes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              OCR Calibration & ROI Bounding Boxes
            </h3>
            <button
              onClick={handleResetCalibration}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Countdown Box */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
              <span className="text-white font-medium block">Countdown Digit Region (ROI)</span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">X</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.countdownArea.x}
                    onChange={(e) => handleUpdateRegion('countdownArea', 'x', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.countdownArea.y}
                    onChange={(e) => handleUpdateRegion('countdownArea', 'y', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Width</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.countdownArea.width}
                    onChange={(e) => handleUpdateRegion('countdownArea', 'width', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Height</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.countdownArea.height}
                    onChange={(e) => handleUpdateRegion('countdownArea', 'height', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Round Number Box */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
              <span className="text-white font-medium block">Round Number ID Region (ROI)</span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">X</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.roundNumberArea.x}
                    onChange={(e) => handleUpdateRegion('roundNumberArea', 'x', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.roundNumberArea.y}
                    onChange={(e) => handleUpdateRegion('roundNumberArea', 'y', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Width</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.roundNumberArea.width}
                    onChange={(e) => handleUpdateRegion('roundNumberArea', 'width', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Height</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.roundNumberArea.height}
                    onChange={(e) => handleUpdateRegion('roundNumberArea', 'height', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Result Popup Box */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
              <span className="text-white font-medium block">Result Popup Banner Region (ROI)</span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">X</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.resultPopupArea.x}
                    onChange={(e) => handleUpdateRegion('resultPopupArea', 'x', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.resultPopupArea.y}
                    onChange={(e) => handleUpdateRegion('resultPopupArea', 'y', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Width</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.resultPopupArea.width}
                    onChange={(e) => handleUpdateRegion('resultPopupArea', 'width', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Height</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibration.resultPopupArea.height}
                    onChange={(e) => handleUpdateRegion('resultPopupArea', 'height', parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Audio, Prediction Timing & Database Maintenance */}
        <div className="space-y-6">
          {/* Audio & Alert Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Audio Alert Notifications
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
              <div>
                <span className="text-white font-medium block">Prediction Ready Chime</span>
                <span className="text-slate-400 text-[11px]">Plays audio chime at 5s remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestChime}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
                >
                  Test Chime
                </button>
                <button
                  onClick={handleToggleSound}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Database Maintenance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Local Storage / SQLite Database Management
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                id="settings-btn-export-csv"
                onClick={onExportCSV}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export CSV Data
              </button>

              <button
                id="settings-btn-export-json"
                onClick={onExportJSON}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                Export JSON
              </button>

              <button
                id="settings-btn-reset-demo"
                onClick={onResetSeed}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Seed Data
              </button>

              <button
                id="settings-btn-clear-db"
                onClick={onClearAll}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Wipe All Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Code Modal */}
      <AndroidCodeModal isOpen={isAndroidModalOpen} onClose={() => setIsAndroidModalOpen(false)} />
    </div>
  );
};
