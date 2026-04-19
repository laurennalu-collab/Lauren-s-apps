import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle } from 'react-konva';
import Konva from 'konva';
import type { FurnitureItem, ScaleCalibration, DrawnShape, DrawingTool } from '../types';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SCALE_BY = 1.18;
const MIN_SCALE = 0.15;
const MAX_SCALE = 8;

interface Zoom { scale: number; x: number; y: number }

interface Props {
  floorplanImage: HTMLImageElement | null;
  furniture: FurnitureItem[];
  calibration: ScaleCalibration;
  onCalibrationClick: (x: number, y: number) => void;
  onFurnitureUpdate: (items: FurnitureItem[]) => void;
  onFurnitureSelect: (id: string | null) => void;
  selectedId: string | null;
  stageSize: { width: number; height: number };
  drawnShapes: DrawnShape[];
  drawingTool: DrawingTool;
  onAddShape: (shape: DrawnShape) => void;
  onDeleteShape: (id: string) => void;
  wallInProgress: number[];
  onWallProgress: (points: number[]) => void;
  tabId: string;
}

export default function FloorplanCanvas({
  floorplanImage, furniture, calibration,
  onCalibrationClick, onFurnitureUpdate, onFurnitureSelect,
  selectedId, stageSize, drawnShapes, drawingTool,
  onAddShape, onDeleteShape, wallInProgress, onWallProgress,
  tabId,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [zoom, setZoom] = useState<Zoom>({ scale: 1, x: 0, y: 0 });
  const [roomDraft, setRoomDraft] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const isDrawing = useRef(false);
  const pinchLastDist = useRef(0);

  // Reset zoom when switching tabs
  useEffect(() => { setZoom({ scale: 1, x: 0, y: 0 }); }, [tabId]);

  const ppi = calibration.pixelsPerInch;
  const toPixels = (inches: number) => inches * ppi;

  // Convert stage-container coords → canvas-space coords (accounting for zoom)
  const toCanvas = (pos: { x: number; y: number }): { x: number; y: number } => ({
    x: (pos.x - zoom.x) / zoom.scale,
    y: (pos.y - zoom.y) / zoom.scale,
  });

  const getCanvasPos = (): { x: number; y: number } | null => {
    const raw = stageRef.current?.getPointerPosition();
    return raw ? toCanvas(raw) : null;
  };

  // ── Zoom helpers ─────────────────────────────────────────────────────────────

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

  const zoomToward = (cx: number, cy: number, newScale: number) => {
    setZoom((prev) => {
      const s = clampScale(newScale);
      return {
        scale: s,
        x: cx - ((cx - prev.x) / prev.scale) * s,
        y: cy - ((cy - prev.y) / prev.scale) * s,
      };
    });
  };

  const centerOf = () => ({ x: stageSize.width / 2, y: stageSize.height / 2 });

  const handleZoomIn  = () => { const c = centerOf(); zoomToward(c.x, c.y, zoom.scale * SCALE_BY); };
  const handleZoomOut = () => { const c = centerOf(); zoomToward(c.x, c.y, zoom.scale / SCALE_BY); };
  const handleReset   = () => setZoom({ scale: 1, x: 0, y: 0 });

  // ── Wheel zoom ───────────────────────────────────────────────────────────────

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const ptr = stageRef.current?.getPointerPosition();
    if (!ptr) return;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    zoomToward(ptr.x, ptr.y, zoom.scale * (direction > 0 ? SCALE_BY : 1 / SCALE_BY));
  };

  // ── Pinch zoom ───────────────────────────────────────────────────────────────

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length !== 2) { pinchLastDist.current = 0; return; }
    e.evt.preventDefault();
    const [t1, t2] = [touches[0], touches[1]];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const cx = (t1.clientX + t2.clientX) / 2;
    const cy = (t1.clientY + t2.clientY) / 2;
    const box = stageRef.current?.container().getBoundingClientRect();
    if (box && pinchLastDist.current > 0) {
      const factor = dist / pinchLastDist.current;
      zoomToward(cx - box.left, cy - box.top, zoom.scale * factor);
    }
    pinchLastDist.current = dist;
  };

  const handleTouchEnd = () => { pinchLastDist.current = 0; };

  // ── Stage drag (pan) ─────────────────────────────────────────────────────────

  const canPan = !drawingTool && !calibration.isCalibrating;

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target !== stageRef.current) return;
    setZoom((prev) => ({ ...prev, x: e.target.x(), y: e.target.y() }));
  };

  // ── Drawing mouse events ─────────────────────────────────────────────────────

  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingTool !== 'room') return;
    const pos = getCanvasPos();
    if (!pos) return;
    isDrawing.current = true;
    setRoomDraft({ sx: pos.x, sy: pos.y, ex: pos.x, ey: pos.y });
  };

  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getCanvasPos();
    if (!pos) return;
    setCursorPos(pos);
    if (drawingTool === 'room' && isDrawing.current && roomDraft) {
      setRoomDraft((d) => d ? { ...d, ex: pos.x, ey: pos.y } : d);
    }
  };

  const handleMouseUp = () => {
    if (drawingTool !== 'room' || !isDrawing.current || !roomDraft) return;
    isDrawing.current = false;
    const w = Math.abs(roomDraft.ex - roomDraft.sx);
    const h = Math.abs(roomDraft.ey - roomDraft.sy);
    if (w > 8 && h > 8) {
      onAddShape({ id: genId(), type: 'room', x: Math.min(roomDraft.sx, roomDraft.ex), y: Math.min(roomDraft.sy, roomDraft.ey), width: w, height: h });
    }
    setRoomDraft(null);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getCanvasPos();
    if (!pos) return;
    if (calibration.isCalibrating) { onCalibrationClick(pos.x, pos.y); return; }
    if (drawingTool === 'wall') { onWallProgress([...wallInProgress, pos.x, pos.y]); return; }
    if (!drawingTool && (e.target === e.target.getStage() || e.target instanceof Konva.Image)) {
      onFurnitureSelect(null);
    }
  };

  // ── Furniture helpers ────────────────────────────────────────────────────────

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onFurnitureUpdate(furniture.map((f) => f.id === id ? { ...f, x: e.target.x(), y: e.target.y() } : f));
  };

  const handleRotate = (id: string) => {
    onFurnitureUpdate(furniture.map((f) => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f));
  };

  // ── Derived render values ────────────────────────────────────────────────────

  const calibrationLine = calibration.calibrationStart && calibration.calibrationEnd
    ? [calibration.calibrationStart.x, calibration.calibrationStart.y, calibration.calibrationEnd.x, calibration.calibrationEnd.y]
    : calibration.calibrationStart
    ? [calibration.calibrationStart.x, calibration.calibrationStart.y, calibration.calibrationStart.x, calibration.calibrationStart.y]
    : null;

  const draftRect = roomDraft ? {
    x: Math.min(roomDraft.sx, roomDraft.ex), y: Math.min(roomDraft.sy, roomDraft.ey),
    w: Math.abs(roomDraft.ex - roomDraft.sx), h: Math.abs(roomDraft.ey - roomDraft.sy),
  } : null;

  const getCursor = () => {
    if (canPan) return 'grab';
    if (calibration.isCalibrating || drawingTool === 'room' || drawingTool === 'wall') return 'crosshair';
    if (drawingTool === 'erase') return 'not-allowed';
    return 'default';
  };

  // Scale-invariant stroke widths (stay 2px on screen regardless of zoom)
  const strokeW = (px: number) => px / zoom.scale;

  return (
    <div style={{ position: 'relative', width: stageSize.width, height: stageSize.height, flexShrink: 0 }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={zoom.x} y={zoom.y}
        scaleX={zoom.scale} scaleY={zoom.scale}
        draggable={canPan}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: getCursor(), background: '#f5f5f0' }}
      >
        {/* Background image */}
        <Layer>
          {floorplanImage && (
            <KonvaImage image={floorplanImage} x={0} y={0}
              width={stageSize.width} height={stageSize.height}
              listening={calibration.isCalibrating || drawingTool === 'room'} />
          )}
        </Layer>

        {/* Drawn shapes */}
        <Layer>
          {drawnShapes.map((shape) => shape.type === 'room' ? (
            <Group key={shape.id}>
              <Rect x={shape.x} y={shape.y} width={shape.width} height={shape.height}
                fill="rgba(210,220,230,0.35)" stroke="#4a5568" strokeWidth={strokeW(2)}
                listening={drawingTool === 'erase'}
                onClick={drawingTool === 'erase' ? (e) => { e.cancelBubble = true; onDeleteShape(shape.id); } : undefined}
                onMouseEnter={drawingTool === 'erase' ? (e) => { (e.target as Konva.Rect).stroke('#d9534f'); e.target.getLayer()?.draw(); } : undefined}
                onMouseLeave={drawingTool === 'erase' ? (e) => { (e.target as Konva.Rect).stroke('#4a5568'); e.target.getLayer()?.draw(); } : undefined}
              />
            </Group>
          ) : (
            <Line key={shape.id} points={shape.points} stroke="#2d3748" strokeWidth={strokeW(4)}
              lineCap="round" lineJoin="round"
              listening={drawingTool === 'erase'}
              onClick={drawingTool === 'erase' ? (e) => { e.cancelBubble = true; onDeleteShape(shape.id); } : undefined}
              onMouseEnter={drawingTool === 'erase' ? (e) => { (e.target as Konva.Line).stroke('#d9534f'); e.target.getLayer()?.draw(); } : undefined}
              onMouseLeave={drawingTool === 'erase' ? (e) => { (e.target as Konva.Line).stroke('#2d3748'); e.target.getLayer()?.draw(); } : undefined}
            />
          ))}

          {draftRect && (
            <Rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h}
              fill="rgba(74,144,217,0.15)" stroke="#4A90D9" strokeWidth={strokeW(2)}
              dash={[6 / zoom.scale, 3 / zoom.scale]} listening={false} />
          )}

          {wallInProgress.length >= 4 && (
            <Line points={wallInProgress} stroke="#2d3748" strokeWidth={strokeW(4)} lineCap="round" lineJoin="round" listening={false} />
          )}
          {wallInProgress.length >= 2 && cursorPos && (
            <Line points={[wallInProgress[wallInProgress.length - 2], wallInProgress[wallInProgress.length - 1], cursorPos.x, cursorPos.y]}
              stroke="#4A90D9" strokeWidth={strokeW(3)} dash={[6 / zoom.scale, 3 / zoom.scale]} opacity={0.7} listening={false} />
          )}
          {wallInProgress.length >= 2 && Array.from({ length: wallInProgress.length / 2 }, (_, i) => (
            <Circle key={i} x={wallInProgress[i * 2]} y={wallInProgress[i * 2 + 1]}
              radius={4 / zoom.scale} fill="#4A90D9" listening={false} />
          ))}
        </Layer>

        {/* Furniture */}
        <Layer>
          {furniture.map((item) => {
            const pw = toPixels(item.width);
            const ph = toPixels(item.height);
            const isSelected = item.id === selectedId;
            return (
              <Group key={item.id} x={item.x} y={item.y} rotation={item.rotation}
                draggable={!calibration.isCalibrating && !drawingTool}
                onDragEnd={(e) => handleDragEnd(item.id, e)}
                onClick={(e) => { if (drawingTool) return; e.cancelBubble = true; onFurnitureSelect(item.id); }}
              >
                <Rect x={-pw / 2} y={-ph / 2} width={pw} height={ph}
                  fill={item.color} opacity={0.75}
                  stroke={isSelected ? '#FF6B35' : '#333'}
                  strokeWidth={isSelected ? strokeW(2) : strokeW(1)} cornerRadius={4} />
                <Text x={-pw / 2} y={-ph / 2} width={pw} height={ph}
                  text={`${item.label}\n${item.width}"×${item.height}"`}
                  fontSize={Math.max(8, Math.min(12, pw / 8))}
                  fill="#1a1a1a" align="center" verticalAlign="middle" />
                {isSelected && (
                  <Circle x={pw / 2 + 10 / zoom.scale} y={-ph / 2 - 10 / zoom.scale}
                    radius={10 / zoom.scale} fill="#FF6B35"
                    onClick={(e) => { e.cancelBubble = true; handleRotate(item.id); }} />
                )}
                {isSelected && (
                  <Text x={pw / 2 + 2 / zoom.scale} y={-ph / 2 - 18 / zoom.scale}
                    text="↻" fontSize={14 / zoom.scale} fill="white" listening={false} />
                )}
              </Group>
            );
          })}
        </Layer>

        {/* Calibration overlay */}
        <Layer>
          {calibrationLine && (
            <>
              <Line points={calibrationLine} stroke="#FF0000" strokeWidth={strokeW(2)} dash={[6 / zoom.scale, 3 / zoom.scale]} />
              <Circle x={calibrationLine[0]} y={calibrationLine[1]} radius={5 / zoom.scale} fill="#FF0000" />
              {calibration.calibrationEnd && (
                <Circle x={calibrationLine[2]} y={calibrationLine[3]} radius={5 / zoom.scale} fill="#FF0000" />
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Floating zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
        <button className="zoom-btn zoom-pct" onClick={handleReset} title="Reset zoom">
          {Math.round(zoom.scale * 100)}%
        </button>
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">−</button>
      </div>
    </div>
  );
}
