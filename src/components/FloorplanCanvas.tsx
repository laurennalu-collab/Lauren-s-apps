import { useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle } from 'react-konva';
import Konva from 'konva';
import type { FurnitureItem, ScaleCalibration } from '../types';

interface Props {
  floorplanImage: HTMLImageElement | null;
  furniture: FurnitureItem[];
  calibration: ScaleCalibration;
  onCalibrationClick: (x: number, y: number) => void;
  onFurnitureUpdate: (items: FurnitureItem[]) => void;
  onFurnitureSelect: (id: string | null) => void;
  selectedId: string | null;
  stageSize: { width: number; height: number };
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
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);

  const ppi = calibration.pixelsPerInch;

  const toPixels = (inches: number) => inches * ppi;

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (calibration.isCalibrating) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) onCalibrationClick(pos.x, pos.y);
      return;
    }
    if (e.target === e.target.getStage() || e.target instanceof Konva.Image) {
      onFurnitureSelect(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onFurnitureUpdate(
      furniture.map((f) =>
        f.id === id ? { ...f, x: e.target.x(), y: e.target.y() } : f
      )
    );
  };

  const handleRotate = (id: string) => {
    onFurnitureUpdate(
      furniture.map((f) =>
        f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
      )
    );
  };

  const calibrationLine =
    calibration.calibrationStart && calibration.calibrationEnd
      ? [
          calibration.calibrationStart.x,
          calibration.calibrationStart.y,
          calibration.calibrationEnd.x,
          calibration.calibrationEnd.y,
        ]
      : calibration.calibrationStart
      ? [
          calibration.calibrationStart.x,
          calibration.calibrationStart.y,
          calibration.calibrationStart.x,
          calibration.calibrationStart.y,
        ]
      : null;

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onClick={handleStageClick}
      style={{ cursor: calibration.isCalibrating ? 'crosshair' : 'default', background: '#f5f5f0' }}
    >
      <Layer>
        {floorplanImage && (
          <KonvaImage
            image={floorplanImage}
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            listening={calibration.isCalibrating}
          />
        )}

        {furniture.map((item) => {
          const pw = toPixels(item.width);
          const ph = toPixels(item.height);
          const isSelected = item.id === selectedId;

          return (
            <Group
              key={item.id}
              x={item.x}
              y={item.y}
              rotation={item.rotation}
              draggable={!calibration.isCalibrating}
              onDragEnd={(e) => handleDragEnd(item.id, e)}
              onClick={(e) => {
                e.cancelBubble = true;
                onFurnitureSelect(item.id);
              }}
            >
              <Rect
                x={-pw / 2}
                y={-ph / 2}
                width={pw}
                height={ph}
                fill={item.color}
                opacity={0.75}
                stroke={isSelected ? '#FF6B35' : '#333'}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={4}
              />
              <Text
                x={-pw / 2}
                y={-ph / 2}
                width={pw}
                height={ph}
                text={`${item.label}\n${item.width}"×${item.height}"`}
                fontSize={Math.max(8, Math.min(12, pw / 8))}
                fill="#1a1a1a"
                align="center"
                verticalAlign="middle"
              />
              {isSelected && (
                <Circle
                  x={pw / 2 + 10}
                  y={-ph / 2 - 10}
                  radius={10}
                  fill="#FF6B35"
                  onClick={(e) => {
                    e.cancelBubble = true;
                    handleRotate(item.id);
                  }}
                />
              )}
              {isSelected && (
                <Text
                  x={pw / 2 + 2}
                  y={-ph / 2 - 18}
                  text="↻"
                  fontSize={14}
                  fill="white"
                  listening={false}
                />
              )}
            </Group>
          );
        })}

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
