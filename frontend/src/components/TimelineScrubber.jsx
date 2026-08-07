import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';

export default function TimelineScrubber({
  timelineData,
  currentKeyframeIndex,
  setKeyframeIndex,
  isPlayingTimeline,
  setIsPlayingTimeline,
}) {
  if (!timelineData || !timelineData.keyframes) return null;

  const keyframes = timelineData.keyframes;
  const currentKeyframe = keyframes[currentKeyframeIndex];

  // Auto-play timeline timer
  useEffect(() => {
    let interval = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setKeyframeIndex((prev) => (prev + 1) % keyframes.length);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline, keyframes.length, setKeyframeIndex]);

  return (
    <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Timeline Playback Controls & Info */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setKeyframeIndex(Math.max(0, currentKeyframeIndex - 1))}
              disabled={currentKeyframeIndex === 0}
              className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
              title="Previous Keyframe"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-all duration-200 shadow-md shadow-cyan-600/20"
              title={isPlayingTimeline ? "Pause Simulation" : "Play Simulation Replay"}
            >
              {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => setKeyframeIndex(Math.min(keyframes.length - 1, currentKeyframeIndex + 1))}
              disabled={currentKeyframeIndex === keyframes.length - 1}
              className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
              title="Next Keyframe"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>Historical Satellite Keyframe</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {currentKeyframe?.label || currentKeyframe?.timestamp}
            </div>
          </div>
        </div>

        {/* Horizontal Keyframe Scrubber */}
        <div className="w-full md:flex-1 px-2">
          <div className="relative py-2">
            {/* Slider track line */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${((currentKeyframeIndex) / (keyframes.length - 1)) * 100}%` }}
              />
            </div>

            {/* Keyframe step points */}
            <div className="flex justify-between relative -mt-3.5">
              {keyframes.map((kf, idx) => {
                const isActive = idx === currentKeyframeIndex;
                const isGap = kf.data_gap;
                return (
                  <button
                    key={kf.timestamp}
                    onClick={() => setKeyframeIndex(idx)}
                    className="group flex flex-col items-center focus:outline-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-600 border-white ring-4 ring-cyan-500/20 scale-125'
                          : isGap
                          ? 'bg-amber-100 border-amber-500 group-hover:scale-110'
                          : 'bg-white border-slate-400 group-hover:border-slate-600'
                      }`}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-[10px] font-medium mt-1 font-mono transition-colors ${
                      isActive ? 'text-cyan-700 font-bold' : isGap ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {kf.timestamp.split('T')[0].slice(5)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="shrink-0">
          <ConfidenceBadge
            confidence={currentKeyframe?.confidence}
            source={currentKeyframe?.source}
          />
        </div>

      </div>
    </div>
  );
}
