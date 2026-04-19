import { useEffect, useState } from 'react';
import type { DrawingTool, DrawnRoom } from '../types';

interface Props {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  wallInProgress: boolean;
  onFinishWall: () => void;
  onCancelWall: () => void;
  onClearAll: () => void;
  selectedRoom: DrawnRoom | null;
  ppi: number;
  onResizeRoom: (id: string, widthPx: number, heightPx: number) => void;
  onAddRoom: () => void;
  onAddWall: () => void;
}

const TOOLS: { tool: DrawingTool; label: string; icon: string; hint: string }[] = [
  { tool: 'room',  label: 'Room',  icon: '▭', hint: 'Click and drag to draw a room' },
  { tool: 'wall',  label: 'Wall',  icon: '╱', hint: 'Click to place points, finish when done' },
  { tool: 'erase', label: 'Erase', icon: '✕', hint: 'Click a wall or room to delete it' },
];

function pxToFtIn(px: number, ppi: number) {
  const totalIn = px / ppi;
  return { ft: Math.floor(totalIn / 12), inches: Math.round((totalIn % 12) * 10) / 10 };
}

function ftInToPx(ft: number, inches: number, ppi: number) {
  return (ft * 12 + inches) * ppi;
}

function RoomEditor({ room, ppi, onResizeRoom }: {
  room: DrawnRoom; ppi: number; onResizeRoom: (id: string, w: number, h: number) => void;
}) {
  const wFtIn = pxToFtIn(room.width,  ppi);
  const hFtIn = pxToFtIn(room.height, ppi);

  const [wFt, setWFt] = useState(String(wFtIn.ft));
  const [wIn, setWIn] = useState(String(wFtIn.inches));
  const [hFt, setHFt] = useState(String(hFtIn.ft));
  const [hIn, setHIn] = useState(String(hFtIn.inches));

  // Sync when room changes (different room selected or external resize)
  useEffect(() => {
    const w = pxToFtIn(room.width, ppi);
    const h = pxToFtIn(room.height, ppi);
    setWFt(String(w.ft));
    setWIn(String(w.inches));
    setHFt(String(h.ft));
    setHIn(String(h.inches));
  }, [room.id, room.width, room.height, ppi]);

  const commit = () => {
    const newW = ftInToPx(parseFloat(wFt) || 0, parseFloat(wIn) || 0, ppi);
    const newH = ftInToPx(parseFloat(hFt) || 0, parseFloat(hIn) || 0, ppi);
    if (newW > 1 && newH > 1) onResizeRoom(room.id, newW, newH);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px', borderRadius: 4,
    border: '1px solid #ccc', fontSize: 13,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#EBF3FC', borderRadius: 8, border: '1px solid #4A90D9' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e4a7a' }}>Room Dimensions</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {/* Width */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555', fontWeight: 600 }}>Width</p>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} value={wFt} onChange={(e) => setWFt(e.target.value)} onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888', textAlign: 'center' }}>ft</p>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} max={11} step={0.5} value={wIn}
                onChange={(e) => setWIn(e.target.value)} onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888', textAlign: 'center' }}>in</p>
            </div>
          </div>
        </div>

        {/* Height */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: '#555', fontWeight: 600 }}>Height (depth)</p>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} value={hFt} onChange={(e) => setHFt(e.target.value)} onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888', textAlign: 'center' }}>ft</p>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} max={11} step={0.5} value={hIn}
                onChange={(e) => setHIn(e.target.value)} onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888', textAlign: 'center' }}>in</p>
            </div>
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 10, color: '#555' }}>Press Enter or click away to apply</p>
    </div>
  );
}

export default function DrawingPanel({
  activeTool, onToolChange, wallInProgress,
  onFinishWall, onCancelWall, onClearAll,
  selectedRoom, ppi, onResizeRoom, onAddRoom, onAddWall,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Quick-add buttons — work without dragging, great for mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={onAddRoom}
          style={{ padding: '10px 12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
        >
          + Add Room
        </button>
        <button
          onClick={onAddWall}
          style={{ padding: '10px 12px', background: '#4a5568', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
        >
          + Add Wall Segment
        </button>
      </div>

      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#777' }}>
        Shapes appear at canvas center — drag to reposition, or select and edit dimensions below.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #e0dbd4', margin: '2px 0' }} />

      {/* Tool buttons for desktop drag-drawing */}
      <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Draw tools (drag on desktop)
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {TOOLS.map(({ tool, label, icon }) => (
          <button key={tool}
            onClick={() => onToolChange(activeTool === tool ? null : tool)}
            style={{
              padding: '8px 4px',
              background: activeTool === tool ? '#2c3e50' : '#f0ede8',
              color: activeTool === tool ? 'white' : '#333',
              border: `1px solid ${activeTool === tool ? '#2c3e50' : '#ccc'}`,
              borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {activeTool && (
        <p style={{ margin: 0, fontSize: 11, color: '#555', background: '#f0ede8', padding: '6px 8px', borderRadius: 6 }}>
          {TOOLS.find((t) => t.tool === activeTool)?.hint}
        </p>
      )}

      {!activeTool && (
        <p style={{ margin: 0, fontSize: 11, color: '#777', padding: '6px 8px', background: '#f0ede8', borderRadius: 6 }}>
          Click a room to select it and edit its dimensions.
        </p>
      )}

      {selectedRoom && ppi > 0 ? (
        <RoomEditor room={selectedRoom} ppi={ppi} onResizeRoom={onResizeRoom} />
      ) : selectedRoom && ppi === 0 ? (
        <div style={{ padding: '8px 10px', background: '#FFF3E0', borderRadius: 6, border: '1px solid #FF6B35', fontSize: 12, color: '#8a4a00' }}>
          Set scale (Arrange tab) to edit dimensions in feet and inches.
        </div>
      ) : null}

      {wallInProgress && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onFinishWall}
            style={{ flex: 1, padding: '7px', background: '#2a7a2a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Finish Wall
          </button>
          <button onClick={onCancelWall}
            style={{ flex: 1, padding: '7px', background: '#888', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
        </div>
      )}

      <button onClick={onClearAll}
        style={{ padding: '6px', background: 'none', color: '#d9534f', border: '1px solid #d9534f', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
        Clear All Drawings
      </button>
    </div>
  );
}
