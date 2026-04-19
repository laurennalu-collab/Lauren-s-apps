import { useCallback, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import FloorplanCanvas from './components/FloorplanCanvas';
import FurniturePalette from './components/FurniturePalette';
import ScalePanel from './components/ScalePanel';
import type { FurnitureItem, ScaleCalibration } from './types';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href;

const DEFAULT_CALIBRATION: ScaleCalibration = {
  pixelsPerInch: 0,
  isCalibrating: false,
  calibrationStart: null,
  calibrationEnd: null,
  realWorldInches: 0,
};

const CANVAS_W = 900;
const CANVAS_H = 650;

function App() {
  const [floorplanImage, setFloorplanImage] = useState<HTMLImageElement | null>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [calibration, setCalibration] = useState<ScaleCalibration>(DEFAULT_CALIBRATION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const img = new Image();
      img.src = offscreen.toDataURL();
      img.onload = () => setFloorplanImage(img);
    } else {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => setFloorplanImage(img);
    }
    setCalibration(DEFAULT_CALIBRATION);
    setFurniture([]);
  }, []);

  const handleCalibrationClick = useCallback((x: number, y: number) => {
    setCalibration((prev) => {
      if (!prev.calibrationStart) {
        return { ...prev, calibrationStart: { x, y } };
      }
      if (!prev.calibrationEnd) {
        return { ...prev, calibrationEnd: { x, y } };
      }
      return prev;
    });
  }, []);

  const handleConfirmCalibration = useCallback((inches: number) => {
    setCalibration((prev) => {
      if (!prev.calibrationStart || !prev.calibrationEnd) return prev;
      const dx = prev.calibrationEnd.x - prev.calibrationStart.x;
      const dy = prev.calibrationEnd.y - prev.calibrationStart.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      const ppi = pixelDist / inches;
      return {
        ...prev,
        pixelsPerInch: ppi,
        isCalibrating: false,
        realWorldInches: inches,
      };
    });
  }, []);

  const handleCancelCalibration = useCallback(() => {
    setCalibration((prev) => ({
      ...prev,
      isCalibrating: false,
      calibrationStart: null,
      calibrationEnd: null,
    }));
  }, []);

  const handleStartCalibration = useCallback(() => {
    setCalibration((prev) => ({
      ...prev,
      isCalibrating: true,
      calibrationStart: null,
      calibrationEnd: null,
    }));
    setSelectedId(null);
  }, []);

  const handleAddFurniture = useCallback((item: FurnitureItem) => {
    setFurniture((prev) => [...prev, item]);
    setSelectedId(item.id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setFurniture((prev) => prev.filter((f) => f.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    setFurniture((prev) => prev.map((f) => f.id === id ? { ...f, width, height } : f));
  }, []);

  const selectedItem = furniture.find((f) => f.id === selectedId) ?? null;

  const effectivePPI = calibration.pixelsPerInch > 0 ? calibration.pixelsPerInch : 4;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Floorplan Furniture Planner</h1>
        <p>Upload your floorplan, calibrate the scale, and drag furniture into position.</p>
      </header>

      <div className="app-body">
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <>
              <section className="panel">
                <p className="panel-title">Floorplan</p>
                <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                  {floorplanImage ? 'Replace Floorplan' : 'Upload PDF or Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {!floorplanImage && (
                  <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Accepts PNG, JPG, PDF</p>
                )}
              </section>

              <section className="panel">
                <ScalePanel
                  calibration={calibration}
                  onStartCalibration={handleStartCalibration}
                  onConfirmCalibration={handleConfirmCalibration}
                  onCancelCalibration={handleCancelCalibration}
                  hasFloorplan={!!floorplanImage}
                />
              </section>

              <section className="panel furniture-panel">
                <p className="panel-title">Add Furniture</p>
                {calibration.pixelsPerInch === 0 && (
                  <p style={{ fontSize: 11, color: '#c07000', marginBottom: 8 }}>
                    ⚠ Set scale first for accurate sizes
                  </p>
                )}
                <FurniturePalette
                  onAdd={handleAddFurniture}
                  selectedId={selectedId}
                  selectedItem={selectedItem}
                  onDelete={handleDeleteSelected}
                  onResize={handleResize}
                  stageCenter={{ x: CANVAS_W / 2, y: CANVAS_H / 2 }}
                />
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
          {!floorplanImage && (
            <div className="empty-state" onClick={() => fileInputRef.current?.click()}>
              <div className="empty-icon">🏠</div>
              <p>Click to upload a floorplan</p>
              <p style={{ fontSize: 13, color: '#aaa' }}>PDF or image (PNG, JPG)</p>
            </div>
          )}
          <FloorplanCanvas
            floorplanImage={floorplanImage}
            furniture={furniture}
            calibration={{ ...calibration, pixelsPerInch: effectivePPI }}
            onCalibrationClick={handleCalibrationClick}
            onFurnitureUpdate={setFurniture}
            onFurnitureSelect={setSelectedId}
            selectedId={selectedId}
            stageSize={{ width: CANVAS_W, height: CANVAS_H }}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
