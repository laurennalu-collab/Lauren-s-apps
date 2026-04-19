import { FURNITURE_TEMPLATES } from '../furnitureTemplates';
import type { FurnitureItem } from '../types';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  onAdd: (item: FurnitureItem) => void;
  selectedId: string | null;
  onDelete: () => void;
  stageCenter: { x: number; y: number };
}

const CATEGORIES: Record<string, string[]> = {
  Seating: ['sofa-3', 'sofa-2', 'armchair', 'chaise'],
  Tables: ['dining-4', 'dining-6', 'coffee', 'side-table', 'desk'],
  Beds: ['king-bed', 'queen-bed', 'full-bed', 'twin-bed', 'nightstand'],
  Storage: ['dresser', 'bookshelf', 'wardrobe'],
  'Kitchen / Bath': ['kitchen-island', 'bathtub', 'toilet', 'sink'],
};

export default function FurniturePalette({ onAdd, selectedId, onDelete, stageCenter }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selectedId && (
        <div style={{ padding: '8px 12px', background: '#FFF3E0', borderRadius: 8, border: '1px solid #FF6B35' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>Selected item</p>
          <button
            onClick={onDelete}
            style={{
              width: '100%',
              padding: '6px',
              background: '#d9534f',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Delete
          </button>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#666' }}>
            Click orange ↻ button on item to rotate
          </p>
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
