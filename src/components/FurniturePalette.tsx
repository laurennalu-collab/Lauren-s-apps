import { useState } from 'react';
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
  stageCenter: { x: number; y: number };
}

const CATEGORIES: Record<string, string[]> = {
  Seating: ['sofa-3', 'sofa-2', 'armchair', 'chaise'],
  Tables: ['dining-4', 'dining-6', 'coffee', 'side-table', 'desk'],
  Beds: ['king-bed', 'queen-bed', 'full-bed', 'twin-bed', 'nightstand'],
  Storage: ['dresser', 'bookshelf', 'wardrobe'],
  'Kitchen / Bath': ['kitchen-island', 'bathtub', 'toilet', 'sink'],
  Rugs: ['rug-2x3', 'rug-4x6', 'rug-5x8', 'rug-6x9', 'rug-8x10', 'rug-9x12', 'rug-round-4', 'rug-round-6'],
};

export default function FurniturePalette({ onAdd, selectedId, selectedItem, onDelete, onResize, stageCenter }: Props) {
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  // Sync inputs when selection changes
  if (selectedItem && widthInput !== String(selectedItem.width) && heightInput !== String(selectedItem.height)) {
    setWidthInput(String(selectedItem.width));
    setHeightInput(String(selectedItem.height));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selectedId && selectedItem && (
        <div style={{ padding: '10px 12px', background: '#FFF3E0', borderRadius: 8, border: '1px solid #FF6B35', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{selectedItem.label}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#555' }}>
              Width (in)
              <input
                type="number"
                min={1}
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                onBlur={() => {
                  const w = parseFloat(widthInput);
                  if (w > 0) onResize(selectedId, w, selectedItem.height);
                }}
                style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13, marginTop: 2 }}
              />
            </label>
            <label style={{ fontSize: 11, color: '#555' }}>
              Height (in)
              <input
                type="number"
                min={1}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                onBlur={() => {
                  const h = parseFloat(heightInput);
                  if (h > 0) onResize(selectedId, selectedItem.width, h);
                }}
                style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13, marginTop: 2 }}
              />
            </label>
          </div>

          <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Click orange ↻ on item to rotate</p>

          <button
            onClick={onDelete}
            style={{ padding: '6px', background: '#d9534f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Delete
          </button>
        </div>
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
