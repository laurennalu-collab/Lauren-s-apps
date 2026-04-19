import { useEffect, useRef, useState } from 'react';
import type { FloorPlan } from '../types';

interface Props {
  tabs: FloorPlan[];
  activeTabId: string;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: (id: string) => void;
}

export default function TabBar({ tabs, activeTabId, onSwitch, onAdd, onClose, onRename, onExport }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  const startEdit = (tab: FloorPlan) => {
    setEditingId(tab.id);
    setEditValue(tab.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab${tab.id === activeTabId ? ' tab-active' : ''}`}
            onClick={() => onSwitch(tab.id)}
            onDoubleClick={() => startEdit(tab)}
            title="Double-click to rename"
          >
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                className="tab-rename-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tab-name">{tab.name}</span>
            )}
            <button
              className="tab-export"
              title="Save to file"
              onClick={(e) => { e.stopPropagation(); onExport(tab.id); }}
            >
              ↓
            </button>
            {tabs.length > 1 && (
              <button
                className="tab-close"
                title="Close tab"
                onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-add" onClick={onAdd} title="New floor plan">
        + New
      </button>
    </div>
  );
}
