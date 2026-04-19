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

  // Rugs
  { type: 'rug-2x3', label: 'Rug 2×3', widthIn: 24, heightIn: 36, color: '#D4A8C7' },
  { type: 'rug-4x6', label: 'Rug 4×6', widthIn: 48, heightIn: 72, color: '#C9A8D4' },
  { type: 'rug-5x8', label: 'Rug 5×8', widthIn: 60, heightIn: 96, color: '#A8B8D4' },
  { type: 'rug-6x9', label: 'Rug 6×9', widthIn: 72, heightIn: 108, color: '#A8C9D4' },
  { type: 'rug-8x10', label: 'Rug 8×10', widthIn: 96, heightIn: 120, color: '#A8D4BC' },
  { type: 'rug-9x12', label: 'Rug 9×12', widthIn: 108, heightIn: 144, color: '#B8D4A8' },
  { type: 'rug-round-4', label: 'Round Rug 4\'', widthIn: 48, heightIn: 48, color: '#D4C8A8' },
  { type: 'rug-round-6', label: 'Round Rug 6\'', widthIn: 72, heightIn: 72, color: '#D4C8A8' },

  // Closet
  { type: 'closet-hang-single-24', label: 'Single Hang 24"', widthIn: 24, heightIn: 24, color: '#B8C4D4' },
  { type: 'closet-hang-single-36', label: 'Single Hang 36"', widthIn: 36, heightIn: 24, color: '#B8C4D4' },
  { type: 'closet-hang-single-48', label: 'Single Hang 48"', widthIn: 48, heightIn: 24, color: '#B8C4D4' },
  { type: 'closet-hang-double-24', label: 'Double Hang 24"', widthIn: 24, heightIn: 24, color: '#A0B4CC' },
  { type: 'closet-hang-double-36', label: 'Double Hang 36"', widthIn: 36, heightIn: 24, color: '#A0B4CC' },
  { type: 'closet-hang-double-48', label: 'Double Hang 48"', widthIn: 48, heightIn: 24, color: '#A0B4CC' },
  { type: 'closet-hang-long-36', label: 'Long Hang 36"', widthIn: 36, heightIn: 24, color: '#8CA8C0' },
  { type: 'closet-hang-long-48', label: 'Long Hang 48"', widthIn: 48, heightIn: 24, color: '#8CA8C0' },
  { type: 'closet-shelf-24', label: 'Shelf Section 24"', widthIn: 24, heightIn: 16, color: '#C8B89A' },
  { type: 'closet-shelf-36', label: 'Shelf Section 36"', widthIn: 36, heightIn: 16, color: '#C8B89A' },
  { type: 'closet-shelf-48', label: 'Shelf Section 48"', widthIn: 48, heightIn: 16, color: '#C8B89A' },
  { type: 'closet-drawers-24', label: 'Drawer Tower 24"', widthIn: 24, heightIn: 20, color: '#C0A888' },
  { type: 'closet-drawers-36', label: 'Drawer Tower 36"', widthIn: 36, heightIn: 20, color: '#C0A888' },
  { type: 'closet-shoe-24', label: 'Shoe Shelf 24"', widthIn: 24, heightIn: 14, color: '#D4C0A0' },
  { type: 'closet-shoe-36', label: 'Shoe Shelf 36"', widthIn: 36, heightIn: 14, color: '#D4C0A0' },
  { type: 'closet-shoe-cubby', label: 'Shoe Cubby (20 pr)', widthIn: 36, heightIn: 16, color: '#D4C0A0' },
  { type: 'closet-corner', label: 'Corner Unit', widthIn: 24, heightIn: 24, color: '#B4C8B8' },
  { type: 'closet-hamper', label: 'Hamper', widthIn: 14, heightIn: 18, color: '#C8C0B0' },
  { type: 'closet-island', label: 'Closet Island', widthIn: 36, heightIn: 18, color: '#B8A890' },
  { type: 'closet-valet-rod', label: 'Valet Rod', widthIn: 6, heightIn: 14, color: '#C0B8D0' },
  { type: 'closet-belt-rack', label: 'Belt / Tie Rack', widthIn: 12, heightIn: 14, color: '#C0B8D0' },
  { type: 'closet-mirror', label: 'Full-Length Mirror', widthIn: 18, heightIn: 48, color: '#D8E4EC' },
];
