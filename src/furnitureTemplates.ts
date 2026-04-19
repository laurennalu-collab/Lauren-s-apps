import type { FurnitureTemplate } from './types';

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  // Seating
  { type: 'sofa-3', label: 'Sofa (3-seat)', widthIn: 84, heightIn: 36, color: '#7C9EB2' },
  { type: 'sofa-2', label: 'Loveseat', widthIn: 60, heightIn: 34, color: '#7C9EB2' },
  { type: 'armchair', label: 'Armchair', widthIn: 32, heightIn: 32, color: '#8FA8C8' },
  { type: 'chaise', label: 'Chaise Lounge', widthIn: 65, heightIn: 28, color: '#7C9EB2' },

  // Tables
  { type: 'dining-4', label: 'Dining Table (4)', widthIn: 48, heightIn: 30, color: '#C4A882' },
  { type: 'dining-6', label: 'Dining Table (6)', widthIn: 72, heightIn: 36, color: '#C4A882' },
  { type: 'coffee', label: 'Coffee Table', widthIn: 48, heightIn: 24, color: '#B8976E' },
  { type: 'side-table', label: 'Side Table', widthIn: 24, heightIn: 24, color: '#B8976E' },
  { type: 'desk', label: 'Desk', widthIn: 60, heightIn: 30, color: '#A89070' },

  // Beds
  { type: 'king-bed', label: 'King Bed', widthIn: 76, heightIn: 80, color: '#C8A0A0' },
  { type: 'queen-bed', label: 'Queen Bed', widthIn: 60, heightIn: 80, color: '#C8A0A0' },
  { type: 'full-bed', label: 'Full Bed', widthIn: 54, heightIn: 75, color: '#C8A0A0' },
  { type: 'twin-bed', label: 'Twin Bed', widthIn: 38, heightIn: 75, color: '#C8A0A0' },
  { type: 'nightstand', label: 'Nightstand', widthIn: 20, heightIn: 20, color: '#B8976E' },

  // Storage
  { type: 'dresser', label: 'Dresser', widthIn: 60, heightIn: 18, color: '#A89070' },
  { type: 'bookshelf', label: 'Bookshelf', widthIn: 36, heightIn: 12, color: '#A89070' },
  { type: 'wardrobe', label: 'Wardrobe', widthIn: 48, heightIn: 24, color: '#A89070' },

  // Kitchen / Bath
  { type: 'kitchen-island', label: 'Kitchen Island', widthIn: 48, heightIn: 24, color: '#C0C0A0' },
  { type: 'bathtub', label: 'Bathtub', widthIn: 30, heightIn: 60, color: '#A0C0C8' },
  { type: 'toilet', label: 'Toilet', widthIn: 20, heightIn: 28, color: '#D0D8E0' },
  { type: 'sink', label: 'Sink', widthIn: 24, heightIn: 21, color: '#D0D8E0' },
];
