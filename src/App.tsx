import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import FloorplanCanvas from './components/FloorplanCanvas';
import FurniturePalette from './components/FurniturePalette';
import ScalePanel from './components/ScalePanel';
import DrawingPanel from './components/DrawingPanel';
import TabBar from './components/TabBar';
import { useFloorPlans } from './hooks/useFloorPlans';
import type { FurnitureItem, DrawnShape, DrawnRoom, DrawnWall, DrawingTool } from './types';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

const CANVAS_W = 900;
const CANVAS_H = 650;

function compressImageToDataUrl(img: HTMLImageElement): string {
  const MAX = 1400;
  const scale = Math.min(1, MAX / img.naturalWidth, MAX / img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

function App() {
  const {
    tabs, activeTabId, activeTab,
    updateActiveTab, undoActiveTab, canUndo,
    addTab, closeTab, renameTab,
    setActiveTabId, exportTab, importTab,
  } = useFloorPlans();

  // Derived HTMLImageElement — rebuilt whenever the active tab's image URL changes
  const [floorplanImage, setFloorplanImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!activeTab.floorplanImageDataUrl) { setFloorplanImage(null); return; }
    const img = new Image();
    img.src = activeTab.floorplanImageDataUrl;
    img.onload = () => setFloorplanImage(img);
  }, [activeTab.floorplanImageDataUrl]);

  // Per-tab UI state — reset when switching tabs
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'arrange' | 'draw'>('arrange');
  const [drawingTool, setDrawingTool] = useState<DrawingTool>(null);
  const [wallInProgress, setWallInProgress] = useState<number[]>([]);

  const prevTabId = useRef(activeTabId);
  useEffect(() => {
    if (prevTabId.current !== activeTabId) {
      prevTabId.current = activeTabId;
      setSelectedId(null);
      setSelectedShapeId(null);
      setDrawingTool(null);
      setWallInProgress([]);
    }
  }, [activeTabId]);

  // Ctrl/Cmd+Z undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoActiveTab();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undoActiveTab]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let dataUrl: string;
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const ctx = offscreen.getContext('2d')!;
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, canvas: offscreen, viewport }).promise;
      dataUrl = offscreen.toDataURL('image/jpeg', 0.88);
    } else {
      const objectUrl = URL.createObjectURL(file);
      dataUrl = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => { resolve(compressImageToDataUrl(img)); URL.revokeObjectURL(objectUrl); };
        img.src = objectUrl;
      });
    }
    updateActiveTab({ floorplanImageDataUrl: dataUrl });
  }, [updateActiveTab]);

  // ── Calibration ──────────────────────────────────────────────────────────────

  const handleCalibrationClick = useCallback((x: number, y: number) => {
    updateActiveTab({
      calibration: (() => {
        const c = activeTab.calibration;
        if (!c.calibrationStart) return { ...c, calibrationStart: { x, y } };
        if (!c.calibrationEnd) return { ...c, calibrationEnd: { x, y } };
        return c;
      })(),
    });
  }, [activeTab.calibration, updateActiveTab]);

  const handleConfirmCalibration = useCallback((inches: number) => {
    const c = activeTab.calibration;
    if (!c.calibrationStart || !c.calibrationEnd) return;
    const dx = c.calibrationEnd.x - c.calibrationStart.x;
    const dy = c.calibrationEnd.y - c.calibrationStart.y;
    const ppi = Math.sqrt(dx * dx + dy * dy) / inches;
    updateActiveTab({ calibration: { ...c, pixelsPerInch: ppi, isCalibrating: false, realWorldInches: inches } });
  }, [activeTab.calibration, updateActiveTab]);

  const handleCancelCalibration = useCallback(() => {
    updateActiveTab({ calibration: { ...activeTab.calibration, isCalibrating: false, calibrationStart: null, calibrationEnd: null } });
  }, [activeTab.calibration, updateActiveTab]);

  const handleStartCalibration = useCallback(() => {
    updateActiveTab({ calibration: { ...activeTab.calibration, isCalibrating: true, calibrationStart: null, calibrationEnd: null } });
    setSelectedId(null);
  }, [activeTab.calibration, updateActiveTab]);

  // ── Furniture ────────────────────────────────────────────────────────────────

  const handleAddFurniture = useCallback((item: FurnitureItem) => {
    updateActiveTab({ furniture: [...activeTab.furniture, item] });
    setSelectedId(item.id);
  }, [activeTab.furniture, updateActiveTab]);

  const handleDeleteSelected = useCallback(() => {
    updateActiveTab({ furniture: activeTab.furniture.filter((f) => f.id !== selectedId) });
    setSelectedId(null);
  }, [activeTab.furniture, selectedId, updateActiveTab]);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    updateActiveTab({ furniture: activeTab.furniture.map((f) => f.id === id ? { ...f, width, height } : f) });
  }, [activeTab.furniture, updateActiveTab]);

  const handleRotateFurniture = useCallback((id: string) => {
    updateActiveTab({ furniture: activeTab.furniture.map((f) => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f) });
  }, [activeTab.furniture, updateActiveTab]);

  // ── Drawing ──────────────────────────────────────────────────────────────────

  const handleDrawingToolChange = useCallback((tool: DrawingTool) => {
    setDrawingTool(tool);
    setWallInProgress([]);
    setSelectedId(null);
    if (tool) setSelectedShapeId(null);
  }, []);

  const handleResizeShape = useCallback((id: string, widthPx: number, heightPx: number) => {
    updateActiveTab({
      drawnShapes: activeTab.drawnShapes.map((s) =>
        s.id === id && s.type === 'room' ? { ...s, width: widthPx, height: heightPx } : s
      ),
    });
  }, [activeTab.drawnShapes, updateActiveTab]);

  const handleAddRoom = useCallback(() => {
    const w = 200, h = 150;
    const shape: DrawnRoom = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      type: 'room',
      x: CANVAS_W / 2 - w / 2,
      y: CANVAS_H / 2 - h / 2,
      width: w, height: h,
    };
    updateActiveTab({ drawnShapes: [...activeTab.drawnShapes, shape] });
    setSelectedShapeId(shape.id);
    setDrawingTool(null);
    setSidebarTab('draw');
  }, [activeTab.drawnShapes, updateActiveTab]);

  const handleAddWall = useCallback(() => {
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    const shape: DrawnWall = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      type: 'wall',
      points: [cx - 75, cy, cx + 75, cy],
    };
    updateActiveTab({ drawnShapes: [...activeTab.drawnShapes, shape] });
    setDrawingTool(null);
    setSidebarTab('draw');
  }, [activeTab.drawnShapes, updateActiveTab]);

  const handleFinishWall = useCallback(() => {
    if (wallInProgress.length >= 4) {
      const newShape: DrawnShape = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        type: 'wall',
        points: wallInProgress,
      };
      updateActiveTab({ drawnShapes: [...activeTab.drawnShapes, newShape] });
    }
    setWallInProgress([]);
  }, [wallInProgress, activeTab.drawnShapes, updateActiveTab]);

  // ── Import ───────────────────────────────────────────────────────────────────

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => importTab(ev.target?.result as string);
    reader.readAsText(file);
  }, [importTab]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const calibration = activeTab.calibration;
  const effectivePPI = calibration.pixelsPerInch > 0 ? calibration.pixelsPerInch : 4;
  const selectedItem = activeTab.furniture.find((f) => f.id === selectedId) ?? null;
  const hasContent = !!floorplanImage || activeTab.drawnShapes.length > 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Floorplan Furniture Planner</h1>
        <p style={{ flex: 1 }}>Upload or draw a floor plan, calibrate scale, and arrange furniture.</p>
        <button
          onClick={undoActiveTab}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="undo-btn"
        >
          ↩ Undo
        </button>
      </header>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitch={setActiveTabId}
        onAdd={addTab}
        onClose={closeTab}
        onRename={renameTab}
        onExport={exportTab}
      />

      <div className="app-body">
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'}>
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <>
              <div className="sidebar-tabs">
                <button className={`sidebar-tab${sidebarTab === 'arrange' ? ' active' : ''}`}
                  onClick={() => { setSidebarTab('arrange'); handleDrawingToolChange(null); }}>
                  Arrange
                </button>
                <button className={`sidebar-tab${sidebarTab === 'draw' ? ' active' : ''}`}
                  onClick={() => setSidebarTab('draw')}>
                  Draw
                </button>
              </div>

              {sidebarTab === 'arrange' && (
                <>
                  <section className="panel">
                    <p className="panel-title">Floorplan Image</p>
                    <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                      {floorplanImage ? 'Replace Image' : 'Upload PDF or Image'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                    {floorplanImage && (
                      <button onClick={() => updateActiveTab({ floorplanImageDataUrl: null })}
                        style={{ width: '100%', marginTop: 6, padding: '5px', background: 'none', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#666' }}>
                        Remove Image
                      </button>
                    )}
                    {!floorplanImage && <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>PNG, JPG, or PDF</p>}
                  </section>

                  <section className="panel">
                    <ScalePanel
                      calibration={calibration}
                      onStartCalibration={handleStartCalibration}
                      onConfirmCalibration={handleConfirmCalibration}
                      onCancelCalibration={handleCancelCalibration}
                      hasFloorplan={hasContent}
                    />
                  </section>

                  <section className="panel furniture-panel">
                    <p className="panel-title">Add Furniture</p>
                    {calibration.pixelsPerInch === 0 && (
                      <p style={{ fontSize: 11, color: '#c07000', marginBottom: 8 }}>⚠ Set scale first for accurate sizes</p>
                    )}
                    <FurniturePalette
                      onAdd={handleAddFurniture}
                      selectedId={selectedId}
                      selectedItem={selectedItem}
                      onDelete={handleDeleteSelected}
                      onResize={handleResize}
                      onRotate={handleRotateFurniture}
                      stageCenter={{ x: CANVAS_W / 2, y: CANVAS_H / 2 }}
                      ppi={calibration.pixelsPerInch}
                    />
                  </section>
                </>
              )}

              {sidebarTab === 'draw' && (
                <>
                  <section className="panel">
                    <p className="panel-title">Draw Floor Plan</p>
                    <p style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                      Draw rooms and walls, or upload a background image to trace over.
                    </p>
                    <DrawingPanel
                      activeTool={drawingTool}
                      onToolChange={handleDrawingToolChange}
                      wallInProgress={wallInProgress.length >= 2}
                      onFinishWall={handleFinishWall}
                      onCancelWall={() => setWallInProgress([])}
                      onClearAll={() => { updateActiveTab({ drawnShapes: [] }); setWallInProgress([]); setSelectedShapeId(null); }}
                      selectedRoom={(activeTab.drawnShapes.find((s) => s.id === selectedShapeId && s.type === 'room') as import('./types').DrawnRoom) ?? null}
                      ppi={activeTab.calibration.pixelsPerInch}
                      onResizeRoom={handleResizeShape}
                      onAddRoom={handleAddRoom}
                      onAddWall={handleAddWall}
                    />
                  </section>

                  <section className="panel">
                    <p className="panel-title">Background Image</p>
                    <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                      {floorplanImage ? 'Replace Image' : 'Upload as Background'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                    {floorplanImage && (
                      <button onClick={() => updateActiveTab({ floorplanImageDataUrl: null })}
                        style={{ width: '100%', marginTop: 6, padding: '5px', background: 'none', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#666' }}>
                        Remove Image
                      </button>
                    )}
                  </section>
                </>
              )}

              <section className="panel">
                <p className="panel-title">Import</p>
                <button className="btn-secondary" onClick={() => importInputRef.current?.click()}>
                  Open .floorplan.json
                </button>
                <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
              </section>
            </>
          )}
        </aside>

        <main className="canvas-area">
          {calibration.isCalibrating && (
            <div className="calibration-banner">
              {!calibration.calibrationStart
                ? 'Click the START point of a known distance on the floorplan'
                : !calibration.calibrationEnd
                ? 'Click the END point of that distance'
                : 'Enter the real-world length in the panel, then click Confirm'}
            </div>
          )}
          {!hasContent && !drawingTool && (
            <div className="empty-state" onClick={() => fileInputRef.current?.click()}>
              <div className="empty-icon">🏠</div>
              <p>Upload a floorplan or switch to Draw to get started</p>
            </div>
          )}
          <FloorplanCanvas
            floorplanImage={floorplanImage}
            furniture={activeTab.furniture}
            calibration={{ ...calibration, pixelsPerInch: effectivePPI }}
            onCalibrationClick={handleCalibrationClick}
            onFurnitureUpdate={(items) => updateActiveTab({ furniture: items })}
            onFurnitureSelect={setSelectedId}
            selectedId={selectedId}
            stageSize={{ width: CANVAS_W, height: CANVAS_H }}
            drawnShapes={activeTab.drawnShapes}
            drawingTool={drawingTool}
            drawMode={sidebarTab === 'draw'}
            selectedShapeId={selectedShapeId}
            onShapeSelect={(id) => { setSelectedShapeId(id); if (id) setSelectedId(null); }}
            onAddShape={(shape) => updateActiveTab({ drawnShapes: [...activeTab.drawnShapes, shape] })}
            onDeleteShape={(id) => { updateActiveTab({ drawnShapes: activeTab.drawnShapes.filter((s) => s.id !== id) }); setSelectedShapeId(null); }}
            wallInProgress={wallInProgress}
            onWallProgress={setWallInProgress}
            tabId={activeTabId}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
