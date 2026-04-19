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

export interface DrawnMeasure {
  id: string;
  type: 'measure';
  x1: number; y1: number;
  x2: number; y2: number;
}

export type DrawnShape = DrawnRoom | DrawnWall | DrawnMeasure;
export type DrawingTool = 'room' | 'wall' | 'measure' | 'erase' | null;

export interface FloorPlan {
  id: string;
  name: string;
  furniture: FurnitureItem[];
  drawnShapes: DrawnShape[];
  calibration: ScaleCalibration;
  floorplanImageDataUrl: string | null;
}
