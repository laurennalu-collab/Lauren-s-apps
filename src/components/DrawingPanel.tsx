import type { DrawingTool } from '../types';

interface Props {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  wallInProgress: boolean;
  onFinishWall: () => void;
  onCancelWall: () => void;
  onClearAll: () => void;
}

const TOOLS: { tool: DrawingTool; label: string; icon: string; hint: string }[] = [
  { tool: 'room', label: 'Room', icon: '▭', hint: 'Click and drag to draw a room' },
  { tool: 'wall', label: 'Wall', icon: '╱', hint: 'Click to place points, finish when done' },
  { tool: 'erase', label: 'Erase', icon: '✕', hint: 'Click a wall or room to delete it' },
];

export default function DrawingPanel({
  activeTool,
  onToolChange,
  wallInProgress,
  onFinishWall,
  onCancelWall,
  onClearAll,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {TOOLS.map(({ tool, label, icon }) => (
          <button
            key={tool}
            onClick={() => onToolChange(activeTool === tool ? null : tool)}
            style={{
              padding: '8px 4px',
              background: activeTool === tool ? '#2c3e50' : '#f0ede8',
              color: activeTool === tool ? 'white' : '#333',
              border: `1px solid ${activeTool === tool ? '#2c3e50' : '#ccc'}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
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

      {wallInProgress && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onFinishWall}
            style={{ flex: 1, padding: '7px', background: '#2a7a2a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Finish Wall
          </button>
          <button
            onClick={onCancelWall}
            style={{ flex: 1, padding: '7px', background: '#888', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Cancel
          </button>
        </div>
      )}

      <button
        onClick={onClearAll}
        style={{ padding: '6px', background: 'none', color: '#d9534f', border: '1px solid #d9534f', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
      >
        Clear All Drawings
      </button>
    </div>
  );
}
