import { useEffect, useState } from 'react';
import { FURNITURE_TEMPLATES } from '../furnitureTemplates';
import type { FurnitureItem } from '../types';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  onAdd: (item: FurnitureItem) => void;
  selectedId: string | null;
  selectedItem: FurnitureItem | null;
  onDelete: () => void;
  onResize: (id: string, width: number, height: number) => void;
  onRotate: (id: string) => void;
  onDuplicate: () => void;
  stageCenter: { x: number; y: number };
  ppi: number;
}

const CATEGORIES: Record<string, string[]> = {
  Seating: ['sofa-3', 'sofa-2', 'armchair', 'chaise'],
  Tables: ['dining-4', 'dining-6', 'coffee', 'side-table', 'desk'],
  Beds: ['king-bed', 'queen-bed', 'full-bed', 'twin-bed', 'nightstand'],
  Storage: ['dresser', 'bookshelf', 'wardrobe'],
  'Kitchen / Bath': ['kitchen-island', 'bathtub', 'toilet', 'sink'],
  Rugs: ['rug-2x3', 'rug-4x6', 'rug-5x8', 'rug-6x9', 'rug-8x10', 'rug-9x12', 'rug-round-4', 'rug-round-6'],
  'Closet — Hanging': ['closet-hang-single-24', 'closet-hang-single-36', 'closet-hang-single-48', 'closet-hang-double-24', 'closet-hang-double-36', 'closet-hang-double-48', 'closet-hang-long-36', 'closet-hang-long-48'],
  'Closet — Shelves & Drawers': ['closet-shelf-24', 'closet-shelf-36', 'closet-shelf-48', 'closet-drawers-24', 'closet-drawers-36', 'closet-shoe-24', 'closet-shoe-36', 'closet-shoe-cubby'],
  'Closet — Accessories': ['closet-corner', 'closet-island', 'closet-hamper', 'closet-valet-rod', 'closet-belt-rack', 'closet-mirror'],
};

// ── Resize panel shown when an item is selected ───────────────────────────────

function inToFtIn(totalIn: number) {
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round((totalIn % 12) * 10) / 10;
  return { ft, inches };
}

function FtInResizePanel({ item, onResize, onRotate, onDelete, onDuplicate }: {
  item: FurnitureItem;
  onResize: (id: string, w: number, h: number) => void;
  onRotate: (id: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const wFtIn = inToFtIn(item.width);
  const hFtIn = inToFtIn(item.height);
  const [wFt, setWFt] = useState(String(wFtIn.ft));
  const [wIn, setWIn] = useState(String(wFtIn.inches));
  const [hFt, setHFt] = useState(String(hFtIn.ft));
  const [hIn, setHIn] = useState(String(hFtIn.inches));

  useEffect(() => {
    const w = inToFtIn(item.width);
    const h = inToFtIn(item.height);
    setWFt(String(w.ft)); setWIn(String(w.inches));
    setHFt(String(h.ft)); setHIn(String(h.inches));
  }, [item.id, item.width, item.height]);

  const commit = () => {
    const newW = (parseFloat(wFt) || 0) * 12 + (parseFloat(wIn) || 0);
    const newH = (parseFloat(hFt) || 0) * 12 + (parseFloat(hIn) || 0);
    if (newW > 0 && newH > 0) onResize(item.id, newW, newH);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', borderRadius: 4,
    border: '1px solid #ccc', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = { margin: '0 0 3px', fontSize: 11, color: '#555', fontWeight: 600 };
  const unitStyle: React.CSSProperties = { margin: '2px 0 0', fontSize: 10, color: '#888', textAlign: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: '#FFF3E0', borderRadius: 8, border: '2px solid #FF6B35' }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{item.label}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <p style={labelStyle}>Width</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} value={wFt} onChange={(e) => setWFt(e.target.value)}
                onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={unitStyle}>ft</p>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} max={11} step={0.5} value={wIn}
                onChange={(e) => setWIn(e.target.value)}
                onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={unitStyle}>in</p>
            </div>
          </div>
        </div>
        <div>
          <p style={labelStyle}>Depth</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} value={hFt} onChange={(e) => setHFt(e.target.value)}
                onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={unitStyle}>ft</p>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" min={0} max={11} step={0.5} value={hIn}
                onChange={(e) => setHIn(e.target.value)}
                onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
              <p style={unitStyle}>in</p>
            </div>
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 10, color: '#888' }}>
        Current: {item.width}" × {item.height}" &nbsp;·&nbsp; Tap away or press Enter to apply
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onRotate(item.id)}
          style={{ flex: 1, padding: '7px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          ↻ Rotate 90°
        </button>
        <button onClick={onDuplicate}
          style={{ flex: 1, padding: '7px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          ⧉ Duplicate
        </button>
        <button onClick={onDelete}
          style={{ flex: 1, padding: '7px', background: '#d9534f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function InchResizePanel({ item, onResize, onRotate, onDelete, onDuplicate }: {
  item: FurnitureItem;
  onResize: (id: string, w: number, h: number) => void;
  onRotate: (id: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [w, setW] = useState(String(item.width));
  const [h, setH] = useState(String(item.height));

  useEffect(() => {
    setW(String(item.width));
    setH(String(item.height));
  }, [item.id, item.width, item.height]);

  const commit = () => {
    const nw = parseFloat(w);
    const nh = parseFloat(h);
    if (nw > 0 && nh > 0) onResize(item.id, nw, nh);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', borderRadius: 4,
    border: '1px solid #ccc', fontSize: 14,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: '#FFF3E0', borderRadius: 8, border: '2px solid #FF6B35' }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{item.label}</p>
      <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Set scale (Arrange tab) for ft/in editing.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 11, color: '#555', fontWeight: 600 }}>Width (in)</p>
          <input type="number" min={1} value={w} onChange={(e) => setW(e.target.value)}
            onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 11, color: '#555', fontWeight: 600 }}>Depth (in)</p>
          <input type="number" min={1} value={h} onChange={(e) => setH(e.target.value)}
            onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} style={inputStyle} />
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Tap away or press Enter to apply</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onRotate(item.id)}
          style={{ flex: 1, padding: '7px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          ↻ Rotate 90°
        </button>
        <button onClick={onDuplicate}
          style={{ flex: 1, padding: '7px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          ⧉ Duplicate
        </button>
        <button onClick={onDelete}
          style={{ flex: 1, padding: '7px', background: '#d9534f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main palette ──────────────────────────────────────────────────────────────

export default function FurniturePalette({ onAdd, selectedId, selectedItem, onDelete, onResize, onRotate, onDuplicate, stageCenter, ppi }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selectedId && selectedItem && (
        ppi > 0
          ? <FtInResizePanel item={selectedItem} onResize={onResize} onRotate={onRotate} onDelete={onDelete} onDuplicate={onDuplicate} />
          : <InchResizePanel item={selectedItem} onResize={onResize} onRotate={onRotate} onDelete={onDelete} onDuplicate={onDuplicate} />
      )}

      {!selectedId && (
        <p style={{ margin: 0, fontSize: 11, color: '#777', padding: '6px 8px', background: '#f0ede8', borderRadius: 6 }}>
          Tap a placed item to select it and resize.
        </p>
      )}

      {Object.entries(CATEGORIES).map(([cat, types]) => (
        <div key={cat}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#555', letterSpacing: '0.05em' }}>
            {cat}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FURNITURE_TEMPLATES.filter((t) => types.includes(t.type)).map((tmpl) => (
              <button
                key={tmpl.type}
                onClick={() =>
                  onAdd({
                    id: generateId(),
                    type: tmpl.type,
                    label: tmpl.label,
                    x: stageCenter.x,
                    y: stageCenter.y,
                    width: tmpl.widthIn,
                    height: tmpl.heightIn,
                    rotation: 0,
                    color: tmpl.color,
                  })
                }
                style={{
                  padding: '6px 10px',
                  background: tmpl.color,
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 12,
                  color: '#1a1a1a',
                }}
              >
                <strong>{tmpl.label}</strong>
                <br />
                <span style={{ opacity: 0.7 }}>{tmpl.widthIn}" × {tmpl.heightIn}"</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
