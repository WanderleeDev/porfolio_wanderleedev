// Tipos de Matter.js
export interface MatterBody {
  position: { x: number; y: number };
  angle: number;
  velocity: { x: number; y: number };
}

export interface MatterEngine {
  world: any;
}

export interface MatterRender {
  canvas: HTMLCanvasElement | null;
  options: any;
}

export interface MatterModule {
  Engine: any;
  Render: any;
  Runner: any;
  World: any;
  Bodies: any;
  Body: any;
  Mouse: any;
  MouseConstraint: any;
  Events?: any;
}

export interface ListItem {
  id: number;
  text: string;
  color: string;
  icon: string;
}

export interface ItemPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface Stack {
  id: string;
  title: string;
  gradient: string;
  items: ListItem[];
}

declare global {
  interface Window {
    Matter?: MatterModule;
  }
}

