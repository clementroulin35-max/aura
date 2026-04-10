import { motion } from 'framer-motion';
import './MissionPreview.css';

export default function MissionPreview({
  objective,
  onObjectiveChange,
  onExecute,
  executing,
  disabled,
  lastResult,
}) {
  return (
    <div className="mission-preview glass-panel" id="mission-preview">
      <div className="mp-header">
        <span className="mp-title">🎯 Mission Objective</span>
      </div>

      <div className="mp-body">
        {/* Objective Editor */}
        <div className="mp-objective-box">
          <textarea
            id="objective-editor"
            className="mp-textarea"
            placeholder="L'objectif de mission apparaîtra ici quand ORION le proposera..."
            value={objective}
            onChange={(e) => onObjectiveChange(e.target.value)}
            disabled={disabled}
            rows={4}
          />
        </div>

        {/* RED BUTTON */}
        <div className="mp-button-container">
          <motion.button
            id="red-button"
            className={`red-button ${executing ? 'executing' : ''} ${disabled || !objective.trim() ? 'disabled' : ''}`}
            onClick={onExecute}
            disabled={disabled || executing || !objective.trim()}
            whileTap={!disabled && !executing ? { scale: 0.95 } : {}}
          >
            <span className="red-button-icon">{executing ? '◉' : '●'}</span>
            <span className="red-button-text">
              {executing ? 'EXECUTING...' : 'EXECUTE'}
            </span>
          </motion.button>
        </div>

        {/* Last Result Summary */}
        {lastResult && (
          <motion.div
            className="mp-result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mp-result-header">
              <span className="mp-result-status">{lastResult.status || 'DONE'}</span>
              <span className="mp-result-teams">
                {lastResult.teams_visited?.join(' → ') || '—'}
              </span>
            </div>
            {lastResult.summary && (
              <p className="mp-result-summary">{lastResult.summary}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
