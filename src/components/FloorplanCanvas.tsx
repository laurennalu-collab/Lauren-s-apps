import { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle } from 'react-konva';
import Konva from 'konva';
import type { FurnitureItem, ScaleCalibration, DrawnShape, DrawingTool } from '../types';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  onAddShape: (shape: DrawnShape) => void;
  onDeleteShape: (id: string) => void;
  wallInProgress: number[];
  onWallProgress: (points: number[]) => void;
}

export default function FloorplanCanvas({
  floorplanImage,
  furniture,
  calibration,
  onCalibrationClick,
  onFurnitureUpdate,
  onFurnitureSelect,
  selectedId,
  stageSize,
  drawnShapes,
  drawingTool,
  onAddShape,
  onDeleteShape,
  wallInProgress,
  onWallProgress,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [roomDraft, setRoomDraft] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const isDrawing = useRef(false);

  const ppi = calibration.pixelsPerInch;
  const toPixels = (inches: number) => inches * ppi;

  const getPos = () => stageRef.current?.getPointerPosition() ?? null;

  const getCursor = () => {
    if (calibration.isCalibrating) return 'crosshair';
    if (drawingTool === 'room') return 'crosshair';
    if (drawingTool === 'wall') return 'crosshair';
    if (drawingTool === 'erase') return 'not-allowed';
    return 'default';
  };

  // ── Stage mouse events ──────────────────────────────────────────────────────

  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingTool !== 'room') return;
    const pos = getPos();
    if (!pos) return;
    isDrawing.current = true;
    setRoomDraft({ sx: pos.x, sy: pos.y, ex: pos.x, ey: pos.y });
  };

  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPos();
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
      onAddShape({
        id: genId(),
        type: 'room',
        x: Math.min(roomDraft.sx, roomDraft.ex),
        y: Math.min(roomDraft.sy, roomDraft.ey),
        width: w,
        height: h,
      });
    }
    setRoomDraft(null);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (calibration.isCalibrating) {
      const pos = getPos();
      if (pos) onCalibrationClick(pos.x, pos.y);
      return;
    }
    if (drawingTool === 'wall') {
      const pos = getPos();
      if (!pos) return;
      onWallProgress([...wallInProgress, pos.x, pos.y]);
      return;
    }
    if (!drawingTool) {
      if (e.target === e.target.getStage() || e.target instanceof Konva.Image) {
        onFurnitureSelect(null);
      }
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onFurnitureUpdate(
      furniture.map((f) => f.id === id ? { ...f, x: e.target.x(), y: e.target.y() } : f)
    );
  };

  const handleRotate = (id: string) => {
    onFurnitureUpdate(
      furniture.map((f) => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f)
    );
  };

  const calibrationLine =
    calibration.calibrationStart && calibration.calibrationEnd
      ? [calibration.calibrationStart.x, calibration.calibrationStart.y, calibration.calibrationEnd.x, calibration.calibrationEnd.y]
      : calibration.calibrationStart
      ? [calibration.calibrationStart.x, calibration.calibrationStart.y, calibration.calibrationStart.x, calibration.calibrationStart.y]
      : null;

  // ── Room draft rect ───────────────────────────────────────────────────────────
  const draftRect = roomDraft
    ? {
        x: Math.min(roomDraft.sx, roomDraft.ex),
        y: Math.min(roomDraft.sy, roomDraft.ey),
        w: Math.abs(roomDraft.ex - roomDraft.sx),
        h: Math.abs(roomDraft.ey - roomDraft.sy),
      }
    : null;

  // ── Wall draft preview line ──────────────────────────────────────────────────
  const wallPreviewPoints =
    wallInProgress.length >= 2 && cursorPos
      ? [...wallInProgress, cursorPos.x, cursorPos.y]
      : null;

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: getCursor(), background: '#f5f5f0' }}
    >
      {/* ── Background image ── */}
      <Layer>
        {floorplanImage && (
          <KonvaImage
            image={floorplanImage}
            x={0} y={0}
            width={stageSize.width}
            height={stageSize.height}
            listening={calibration.isCalibrating || drawingTool === 'room'}
          />
        )}
      </Layer>

      {/* ── Drawn shapes ── */}
      <Layer>
        {drawnShapes.map((shape) => {
          if (shape.type === 'room') {
            return (
              <Group key={shape.id}>
                <Rect
                  x={shape.x} y={shape.y}
                  width={shape.width} height={shape.height}
                  fill="rgba(210,220,230,0.35)"
                  stroke="#4a5568"
                  strokeWidth={2}
                  listening={drawingTool === 'erase'}
                  onClick={drawingTool === 'erase' ? (e) => { e.cancelBubble = true; onDeleteShape(shape.id); } : undefined}
                  onMouseEnter={drawingTool === 'erase' ? (e) => { (e.target as Konva.Rect).stroke('#d9534f'); e.target.getLayer()?.draw(); } : undefined}
                  onMouseLeave={drawingTool === 'erase' ? (e) => { (e.target as Konva.Rect).stroke('#4a5568'); e.target.getLayer()?.draw(); } : undefined}
                />
              </Group>
            );
          }
          // wall
          return (
            <Line
              key={shape.id}
              points={shape.points}
              stroke="#2d3748"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              listening={drawingTool === 'erase'}
              onClick={drawingTool === 'erase' ? (e) => { e.cancelBubble = true; onDeleteShape(shape.id); } : undefined}
              onMouseEnter={drawingTool === 'erase' ? (e) => { (e.target as Konva.Line).stroke('#d9534f'); e.target.getLayer()?.draw(); } : undefined}
              onMouseLeave={drawingTool === 'erase' ? (e) => { (e.target as Konva.Line).stroke('#2d3748'); e.target.getLayer()?.draw(); } : undefined}
            />
          );
        })}

        {/* In-progress room draft */}
        {draftRect && (
          <Rect
            x={draftRect.x} y={draftRect.y}
            width={draftRect.w} height={draftRect.h}
            fill="rgba(74,144,217,0.15)"
            stroke="#4A90D9"
            strokeWidth={2}
            dash={[6, 3]}
            listening={false}
          />
        )}

        {/* Completed wall segments so far */}
        {wallInProgress.length >= 4 && (
          <Line points={wallInProgress} stroke="#2d3748" strokeWidth={4} lineCap="round" lineJoin="round" listening={false} />
        )}

        {/* Wall preview line to cursor */}
        {wallPreviewPoints && (
          <Line
            points={[wallInProgress[wallInProgress.length - 2], wallInProgress[wallInProgress.length - 1], cursorPos!.x, cursorPos!.y]}
            stroke="#4A90D9"
            strokeWidth={3}
            dash={[6, 3]}
            opacity={0.7}
            listening={false}
          />
        )}

        {/* Wall point dots */}
        {wallInProgress.length >= 2 &&
          Array.from({ length: wallInProgress.length / 2 }, (_, i) => (
            <Circle
              key={i}
              x={wallInProgress[i * 2]}
              y={wallInProgress[i * 2 + 1]}
              radius={4}
              fill="#4A90D9"
              listening={false}
            />
          ))}
      </Layer>

      {/* ── Furniture ── */}
      <Layer>
        {furniture.map((item) => {
          const pw = toPixels(item.width);
          const ph = toPixels(item.height);
          const isSelected = item.id === selectedId;

          return (
            <Group
              key={item.id}
              x={item.x} y={item.y}
              rotation={item.rotation}
              draggable={!calibration.isCalibrating && !drawingTool}
              onDragEnd={(e) => handleDragEnd(item.id, e)}
              onClick={(e) => {
                if (drawingTool) return;
                e.cancelBubble = true;
                onFurnitureSelect(item.id);
              }}
            >
              <Rect
                x={-pw / 2} y={-ph / 2}
                width={pw} height={ph}
                fill={item.color}
                opacity={0.75}
                stroke={isSelected ? '#FF6B35' : '#333'}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={4}
              />
              <Text
                x={-pw / 2} y={-ph / 2}
                width={pw} height={ph}
                text={`${item.label}\n${item.width}"×${item.height}"`}
                fontSize={Math.max(8, Math.min(12, pw / 8))}
                fill="#1a1a1a"
                align="center"
                verticalAlign="middle"
              />
              {isSelected && (
                <Circle
                  x={pw / 2 + 10} y={-ph / 2 - 10}
                  radius={10} fill="#FF6B35"
                  onClick={(e) => { e.cancelBubble = true; handleRotate(item.id); }}
                />
              )}
              {isSelected && (
                <Text
                  x={pw / 2 + 2} y={-ph / 2 - 18}
                  text="↻" fontSize={14} fill="white" listening={false}
                />
              )}
            </Group>
          );
        })}
      </Layer>

      {/* ── Calibration overlay ── */}
      <Layer>
        {calibrationLine && (
          <>
            <Line points={calibrationLine} stroke="#FF0000" strokeWidth={2} dash={[6, 3]} />
            <Circle x={calibrationLine[0]} y={calibrationLine[1]} radius={5} fill="#FF0000" />
            {calibration.calibrationEnd && (
              <Circle x={calibrationLine[2]} y={calibrationLine[3]} radius={5} fill="#FF0000" />
            )}
          </>
        )}
      </Layer>
    </Stage>
  );
}
