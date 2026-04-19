import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { FurnitureItem, ScaleCalibration, DrawnShape, DrawnRoom, DrawingTool } from '../types';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SCALE_BY = 1.18;
const MIN_SCALE = 0.15;
const MAX_SCALE = 8;

interface Zoom { scale: number; x: number; y: number }

function fmtDim(pixels: number, ppi: number): string {
  if (ppi <= 0) return `${Math.round(pixels)}px`;
  const totalIn = pixels / ppi;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  if (ft === 0) return `${inches}"`;
  if (inches === 0) return `${ft}'`;
  return `${ft}' ${inches}"`;
}

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
  drawMode: boolean;
  selectedShapeId: string | null;
  onShapeSelect: (id: string | null) => void;
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
  drawMode, selectedShapeId, onShapeSelect,
  onAddShape, onDeleteShape, wallInProgress, onWallProgress,
  tabId,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const furnitureRefs = useRef<Map<string, Konva.Group>>(new Map());

  const [zoom, setZoom] = useState<Zoom>({ scale: 1, x: 0, y: 0 });
  const [roomDraft, setRoomDraft] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const isDrawing = useRef(false);
  const roomDraftRef = useRef<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const pinchLastDist = useRef(0);

  const latestRef = useRef<{
    drawingTool: DrawingTool;
    zoom: Zoom;
    startRoomDraw: (p: { x: number; y: number }) => void;
    updateRoomDraw: (p: { x: number; y: number }) => void;
    finishRoomDraw: () => void;
  }>({ drawingTool, zoom, startRoomDraw: () => {}, updateRoomDraw: () => {}, finishRoomDraw: () => {} });

  useEffect(() => { setZoom({ scale: 1, x: 0, y: 0 }); }, [tabId]);

  // Attach / detach Transformer when furniture selection changes
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedId && !drawingTool && !calibration.isCalibrating) {
      const node = furnitureRefs.current.get(selectedId);
      tr.nodes(node ? [node] : []);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedId, drawingTool, calibration.isCalibrating]);

  const ppi = calibration.pixelsPerInch;
  const toPixels = (inches: number) => inches * ppi;
  const sw = (px: number) => px / zoom.scale;

  const toCanvas = (pos: { x: number; y: number }) => ({
    x: (pos.x - zoom.x) / zoom.scale,
    y: (pos.y - zoom.y) / zoom.scale,
  });
  const getCanvasPos = () => {
    const raw = stageRef.current?.getPointerPosition();
    return raw ? toCanvas(raw) : null;
  };

  // ── Zoom ─────────────────────────────────────────────────────────────────────

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

  const zoomToward = (cx: number, cy: number, newScale: number) => {
    setZoom((prev) => {
      const s = clampScale(newScale);
      return { scale: s, x: cx - ((cx - prev.x) / prev.scale) * s, y: cy - ((cy - prev.y) / prev.scale) * s };
    });
  };

  const center = () => ({ x: stageSize.width / 2, y: stageSize.height / 2 });
  const handleZoomIn  = () => { const c = center(); zoomToward(c.x, c.y, zoom.scale * SCALE_BY); };
  const handleZoomOut = () => { const c = center(); zoomToward(c.x, c.y, zoom.scale / SCALE_BY); };
  const handleReset   = () => setZoom({ scale: 1, x: 0, y: 0 });

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const ptr = stageRef.current?.getPointerPosition();
    if (!ptr) return;
    zoomToward(ptr.x, ptr.y, zoom.scale * (e.evt.deltaY < 0 ? SCALE_BY : 1 / SCALE_BY));
  };

  // ── Room drawing helpers ──────────────────────────────────────────────────────

  const startRoomDraw = (pos: { x: number; y: number }) => {
    const draft = { sx: pos.x, sy: pos.y, ex: pos.x, ey: pos.y };
    isDrawing.current = true;
    roomDraftRef.current = draft;
    setRoomDraft(draft);
  };

  const updateRoomDraw = (pos: { x: number; y: number }) => {
    if (!isDrawing.current || !roomDraftRef.current) return;
    const draft = { ...roomDraftRef.current, ex: pos.x, ey: pos.y };
    roomDraftRef.current = draft;
    setCursorPos(pos);
    setRoomDraft(draft);
  };

  const finishRoomDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const draft = roomDraftRef.current;
    roomDraftRef.current = null;
    setRoomDraft(null);
    if (!draft) return;
    const w = Math.abs(draft.ex - draft.sx);
    const h = Math.abs(draft.ey - draft.sy);
    if (w > 8 && h > 8) {
      const newShape: DrawnRoom = {
        id: genId(), type: 'room',
        x: Math.min(draft.sx, draft.ex), y: Math.min(draft.sy, draft.ey),
        width: w, height: h,
      };
      onAddShape(newShape);
      onShapeSelect(newShape.id);
    }
  };

  // Keep latestRef current for native passive-false touch listeners
  useEffect(() => {
    latestRef.current.drawingTool = drawingTool;
    latestRef.current.zoom = zoom;
    latestRef.current.startRoomDraw = startRoomDraw;
    latestRef.current.updateRoomDraw = updateRoomDraw;
    latestRef.current.finishRoomDraw = finishRoomDraw;
  });

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const toCanvasCoords = (touch: Touch) => {
      const box = el.getBoundingClientRect();
      const z = latestRef.current.zoom;
      return { x: (touch.clientX - box.left - z.x) / z.scale, y: (touch.clientY - box.top - z.y) / z.scale };
    };
    const onStart = (e: TouchEvent) => {
      if (latestRef.current.drawingTool !== 'room' || e.touches.length !== 1) return;
      e.preventDefault();
      latestRef.current.startRoomDraw(toCanvasCoords(e.touches[0]));
    };
    const onMove = (e: TouchEvent) => {
      if (latestRef.current.drawingTool !== 'room' || e.touches.length !== 1 || !isDrawing.current) return;
      e.preventDefault();
      latestRef.current.updateRoomDraw(toCanvasCoords(e.touches[0]));
    };
    const onEnd = () => {
      if (latestRef.current.drawingTool === 'room') latestRef.current.finishRoomDraw();
    };
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      e.evt.preventDefault();
      const [t1, t2] = [touches[0], touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const box = stageRef.current?.container().getBoundingClientRect();
      if (box && pinchLastDist.current > 0) {
        zoomToward(cx - box.left, cy - box.top, zoom.scale * (dist / pinchLastDist.current));
      }
      pinchLastDist.current = dist;
    } else {
      pinchLastDist.current = 0;
    }
  };

  const handleTouchEnd = () => { pinchLastDist.current = 0; };

  const canPan = !drawingTool && !calibration.isCalibrating;

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target !== stageRef.current) return;
    setZoom((prev) => ({ ...prev, x: e.target.x(), y: e.target.y() }));
  };

  // ── Mouse drawing ─────────────────────────────────────────────────────────────

  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingTool !== 'room') return;
    const pos = getCanvasPos();
    if (pos) startRoomDraw(pos);
  };

  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getCanvasPos();
    if (!pos) return;
    setCursorPos(pos);
    if (drawingTool === 'room') updateRoomDraw(pos);
  };

  const handleMouseUp = () => {
    if (drawingTool === 'room') finishRoomDraw();
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getCanvasPos();
    if (!pos) return;
    if (calibration.isCalibrating) { onCalibrationClick(pos.x, pos.y); return; }
    if (drawingTool === 'wall') { onWallProgress([...wallInProgress, pos.x, pos.y]); return; }
    if (!drawingTool) {
      if (e.target === e.target.getStage() || e.target instanceof Konva.Image) {
        onFurnitureSelect(null);
        onShapeSelect(null);
      }
    }
  };

  // ── Furniture ────────────────────────────────────────────────────────────────

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onFurnitureUpdate(furniture.map((f) => f.id === id ? { ...f, x: e.target.x(), y: e.target.y() } : f));
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const item = furniture.find((f) => f.id === id);
    if (!item) return;
    const pw = toPixels(item.width);
    const ph = toPixels(item.height);
    const newWidthIn  = (pw * Math.abs(node.scaleX())) / ppi;
    const newHeightIn = (ph * Math.abs(node.scaleY())) / ppi;
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();
    node.scaleX(1);
    node.scaleY(1);
    onFurnitureUpdate(furniture.map((f) =>
      f.id === id ? { ...f, x: newX, y: newY, width: newWidthIn, height: newHeightIn, rotation: newRotation } : f
    ));
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

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

  // ── Label helpers ─────────────────────────────────────────────────────────────

  // Centre label showing W × H
  const DimLabel = ({ cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }) => {
    const label = `${fmtDim(w, ppi)}  ×  ${fmtDim(h, ppi)}`;
    const fs = 12 / zoom.scale;
    const padX = 8 / zoom.scale;
    const padY = 4 / zoom.scale;
    const bw = label.length * fs * 0.55 + padX * 2;
    const bh = fs + padY * 2;
    return (
      <Group x={cx - bw / 2} y={cy - bh / 2} listening={false}>
        <Rect width={bw} height={bh} fill="rgba(20,20,20,0.72)" cornerRadius={3 / zoom.scale} />
        <Text x={padX} y={padY} text={label} fontSize={fs} fill="white" fontStyle="bold" />
      </Group>
    );
  };

  // Pill label centered at the parent Group's origin — used along room walls.
  // Uses x={-bw/2} y={-bh/2} inner-Group shift (same pattern as DimLabel) so
  // the pill is visually centered at wherever the parent Group is positioned.
  const PillLabel = ({ text }: { text: string }) => {
    const fs = 10 / zoom.scale;
    const padX = 5 / zoom.scale;
    const padY = 3 / zoom.scale;
    const bw = text.length * fs * 0.62 + padX * 2;
    const bh = fs + padY * 2;
    return (
      <Group x={-bw / 2} y={-bh / 2} listening={false}>
        <Rect width={bw} height={bh} fill="rgba(30,30,30,0.78)" cornerRadius={3 / zoom.scale} />
        <Text x={padX} y={padY} text={text} fontSize={fs} fill="white" fontStyle="bold" />
      </Group>
    );
  };

  // Shape listening rules
  const shapeListening = (_id: string) => {
    if (drawingTool === 'erase') return true;
    if (drawMode && !drawingTool) return true;
    return false;
  };

  const anchorSz = 9 / zoom.scale;

  return (
    <div ref={divRef} style={{ position: 'relative', width: stageSize.width, height: stageSize.height, flexShrink: 0, touchAction: drawingTool ? 'none' : 'auto' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width} height={stageSize.height}
        x={zoom.x} y={zoom.y} scaleX={zoom.scale} scaleY={zoom.scale}
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
          {drawnShapes.map((shape) => {
            const isSelectable = shapeListening(shape.id);
            const isSelectedShape = shape.id === selectedShapeId;

            if (shape.type === 'room') {
              const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (drawingTool === 'erase') { onDeleteShape(shape.id); return; }
                if (drawMode && !drawingTool) onShapeSelect(shape.id);
              };
              return (
                <Group key={shape.id}>
                  <Rect x={shape.x} y={shape.y} width={shape.width} height={shape.height}
                    fill={isSelectedShape ? 'rgba(74,144,217,0.2)' : 'rgba(210,220,230,0.35)'}
                    stroke={isSelectedShape ? '#4A90D9' : '#4a5568'}
                    strokeWidth={isSelectedShape ? sw(2.5) : sw(2)}
                    listening={isSelectable}
                    onClick={handleClick}
                    onMouseEnter={(e) => {
                      if (!isSelectable) return;
                      (e.target as Konva.Rect).stroke(drawingTool === 'erase' ? '#d9534f' : '#4A90D9');
                      e.target.getLayer()?.draw();
                    }}
                    onMouseLeave={(e) => {
                      (e.target as Konva.Rect).stroke(isSelectedShape ? '#4A90D9' : '#4a5568');
                      e.target.getLayer()?.draw();
                    }}
                  />
                  {/* Width label centred above the top wall — same positioning as draft labels */}
                  <Group x={shape.x + shape.width / 2} y={shape.y - 14 / zoom.scale} listening={false}>
                    <PillLabel text={fmtDim(shape.width, ppi)} />
                  </Group>
                  {/* Height label centred left of the left wall, rotated */}
                  <Group x={shape.x - 6 / zoom.scale} y={shape.y + shape.height / 2} rotation={-90} listening={false}>
                    <PillLabel text={fmtDim(shape.height, ppi)} />
                  </Group>
                </Group>
              );
            }

            // Wall line
            return (
              <Line key={shape.id} points={shape.points}
                stroke={shape.id === selectedShapeId ? '#4A90D9' : '#2d3748'}
                strokeWidth={sw(4)} lineCap="round" lineJoin="round"
                listening={isSelectable}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (drawingTool === 'erase') onDeleteShape(shape.id);
                }}
                onMouseEnter={(e) => {
                  if (!isSelectable) return;
                  (e.target as Konva.Line).stroke(drawingTool === 'erase' ? '#d9534f' : '#4A90D9');
                  e.target.getLayer()?.draw();
                }}
                onMouseLeave={(e) => {
                  (e.target as Konva.Line).stroke('#2d3748');
                  e.target.getLayer()?.draw();
                }}
              />
            );
          })}

          {/* In-progress room draft */}
          {draftRect && (
            <Group>
              <Rect x={draftRect.x} y={draftRect.y} width={draftRect.w} height={draftRect.h}
                fill="rgba(74,144,217,0.15)" stroke="#4A90D9" strokeWidth={sw(2)}
                dash={[6 / zoom.scale, 3 / zoom.scale]} listening={false} />
              <DimLabel
                cx={draftRect.x + draftRect.w / 2} cy={draftRect.y + draftRect.h / 2}
                w={draftRect.w} h={draftRect.h}
              />
              <Group x={draftRect.x + draftRect.w / 2} y={draftRect.y - 14 / zoom.scale} listening={false}>
                <Text text={fmtDim(draftRect.w, ppi)} fontSize={10 / zoom.scale}
                  fill="#4A90D9" fontStyle="bold" align="center"
                  offsetX={(fmtDim(draftRect.w, ppi).length * 5) / zoom.scale} />
              </Group>
              <Group x={draftRect.x - 6 / zoom.scale} y={draftRect.y + draftRect.h / 2}
                rotation={-90} listening={false}>
                <Text text={fmtDim(draftRect.h, ppi)} fontSize={10 / zoom.scale}
                  fill="#4A90D9" fontStyle="bold" align="center"
                  offsetX={(fmtDim(draftRect.h, ppi).length * 5) / zoom.scale} />
              </Group>
            </Group>
          )}

          {/* Wall in-progress */}
          {wallInProgress.length >= 4 && (
            <Line points={wallInProgress} stroke="#2d3748" strokeWidth={sw(4)} lineCap="round" lineJoin="round" listening={false} />
          )}
          {wallInProgress.length >= 2 && cursorPos && (
            <Line
              points={[wallInProgress[wallInProgress.length - 2], wallInProgress[wallInProgress.length - 1], cursorPos.x, cursorPos.y]}
              stroke="#4A90D9" strokeWidth={sw(3)} dash={[6 / zoom.scale, 3 / zoom.scale]} opacity={0.7} listening={false}
            />
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
              <Group
                key={item.id}
                ref={(node) => {
                  if (node) furnitureRefs.current.set(item.id, node);
                  else furnitureRefs.current.delete(item.id);
                }}
                x={item.x} y={item.y} rotation={item.rotation}
                draggable={!calibration.isCalibrating && !drawingTool}
                onDragEnd={(e) => handleDragEnd(item.id, e)}
                onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                onClick={(e) => { if (drawingTool) return; e.cancelBubble = true; onFurnitureSelect(item.id); }}
              >
                <Rect x={-pw / 2} y={-ph / 2} width={pw} height={ph}
                  fill={item.color} opacity={0.75}
                  stroke={isSelected ? '#FF6B35' : '#333'}
                  strokeWidth={isSelected ? sw(2) : sw(1)} cornerRadius={4} />
                <Text x={-pw / 2} y={-ph / 2} width={pw} height={ph}
                  text={`${item.label}\n${item.width}"×${item.height}"`}
                  fontSize={Math.max(8, Math.min(12, pw / 8))}
                  fill="#1a1a1a" align="center" verticalAlign="middle" />
              </Group>
            );
          })}

          {/* Transformer — attached imperatively to the selected furniture Group */}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            anchorSize={anchorSz}
            anchorCornerRadius={2}
            borderStrokeWidth={sw(1)}
            anchorStrokeWidth={sw(1)}
            rotateAnchorOffset={24 / zoom.scale}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
              return newBox;
            }}
          />
        </Layer>

        {/* Calibration overlay */}
        <Layer>
          {calibrationLine && (
            <>
              <Line points={calibrationLine} stroke="#FF0000" strokeWidth={sw(2)} dash={[6 / zoom.scale, 3 / zoom.scale]} />
              <Circle x={calibrationLine[0]} y={calibrationLine[1]} radius={5 / zoom.scale} fill="#FF0000" />
              {calibration.calibrationEnd && (
                <Circle x={calibrationLine[2]} y={calibrationLine[3]} radius={5 / zoom.scale} fill="#FF0000" />
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Zoom controls */}
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
