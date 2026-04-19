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
