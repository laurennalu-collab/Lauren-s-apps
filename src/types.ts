export interface FurnitureItem {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number; // in real-world inches
  height: number; // in real-world inches
  rotation: number;
  color: string;
}

export interface ScaleCalibration {
  pixelsPerInch: number;
  isCalibrating: boolean;
  calibrationStart: { x: number; y: number } | null;
  calibrationEnd: { x: number; y: number } | null;
  realWorldInches: number;
}

export interface FurnitureTemplate {
  type: string;
  label: string;
  widthIn: number;
  heightIn: number;
  color: string;
}

export interface DrawnRoom {
  id: string;
  type: 'room';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawnWall {
  id: string;
  type: 'wall';
  points: number[];
}

export type DrawnShape = DrawnRoom | DrawnWall;
export type DrawingTool = 'room' | 'wall' | 'erase' | null;

export interface FloorPlan {
  id: string;
  name: string;
  furniture: FurnitureItem[];
  drawnShapes: DrawnShape[];
  calibration: ScaleCalibration;
  floorplanImageDataUrl: string | null;
}
