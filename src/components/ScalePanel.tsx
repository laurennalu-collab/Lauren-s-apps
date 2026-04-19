import { useState } from 'react';
import type { ScaleCalibration } from '../types';

interface Props {
  calibration: ScaleCalibration;
  onStartCalibration: () => void;
  onConfirmCalibration: (inches: number) => void;
  onCancelCalibration: () => void;
  hasFloorplan: boolean;
}

export default function ScalePanel({
  calibration,
  onStartCalibration,
  onConfirmCalibration,
  onCancelCalibration,
  hasFloorplan,
}: Props) {
  const [inputVal, setInputVal] = useState('120');

  const hasBothPoints =
    calibration.calibrationStart !== null && calibration.calibrationEnd !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Scale Calibration</p>

      {!calibration.isCalibrating && (
        <>
          {calibration.pixelsPerInch > 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: '#2a7a2a', background: '#e8f5e9', padding: '6px 10px', borderRadius: 6 }}>
              ✓ Scale set: {calibration.pixelsPerInch.toFixed(2)} px/inch
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>No scale set. Furniture sizes may not be accurate.</p>
          )}
          <button
            disabled={!hasFloorplan}
            onClick={onStartCalibration}
            style={{
              padding: '8px',
              background: hasFloorplan ? '#4A90D9' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: hasFloorplan ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            {calibration.pixelsPerInch > 0 ? 'Recalibrate Scale' : 'Set Scale'}
          </button>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>
            Upload a floorplan first, then click two known points on it (e.g. a wall you know the length of).
          </p>
        </>
      )}

      {calibration.isCalibrating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, background: '#FFF3E0', padding: '8px', borderRadius: 6, border: '1px solid #FF6B35' }}>
            {!calibration.calibrationStart
              ? '① Click the START of a known distance on the floorplan'
              : !calibration.calibrationEnd
              ? '② Click the END of that distance'
              : '③ Enter the real-world length, then confirm'}
          </p>

          {hasBothPoints && (
            <>
              <label style={{ fontSize: 12 }}>
                Real-world length (inches):
                <input
                  type="number"
                  value={inputVal}
                  min={1}
                  onChange={(e) => setInputVal(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}
                />
              </label>
              <button
                onClick={() => onConfirmCalibration(parseFloat(inputVal))}
                style={{ padding: '8px', background: '#2a7a2a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Confirm Scale
              </button>
            </>
          )}

          <button
            onClick={onCancelCalibration}
            style={{ padding: '6px', background: '#888', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
