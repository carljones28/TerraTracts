import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface CanvasClimateOverlayProps {
  map: mapboxgl.Map | null;
  activeRiskTypes: { [key: string]: boolean };
  isMapReady: boolean;
}

export function CanvasClimateOverlay({ map, activeRiskTypes, isMapReady }: CanvasClimateOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !isMapReady) return;

    // Remove existing overlay
    if (overlayRef.current) {
      map.removeControl(overlayRef.current);
      overlayRef.current = null;
    }

    const activeTypes = Object.keys(activeRiskTypes).filter(type => activeRiskTypes[type]);
    if (activeTypes.length === 0) return;

    // Create canvas overlay
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    const overlay = new CanvasOverlay(canvas, activeTypes);
    overlayRef.current = overlay;
    
    map.addControl(overlay);

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
      }
    };

  }, [map, activeRiskTypes, isMapReady]);

  return null;
}

class CanvasOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: mapboxgl.Map | null = null;
  private activeTypes: string[];

  constructor(canvas: HTMLCanvasElement, activeTypes: string[]) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.activeTypes = activeTypes;
  }

  onAdd(map: mapboxgl.Map) {
    this.map = map;
    map.getCanvasContainer().appendChild(this.canvas);
    this.resize();
    this.render();
    
    map.on('render', () => this.render());
    map.on('resize', () => this.resize());
    
    return this.canvas;
  }

  onRemove() {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.map = null;
  }

  resize() {
    if (!this.map) return;
    
    const container = this.map.getContainer();
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  async render() {
    if (!this.map) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    try {
      const bounds = this.map.getBounds();
      const apiUrl = `/api/climate-risk-polygons?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}&types=${this.activeTypes.join(',')}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) return;
      
      const data = await response.json();
      if (!data.features?.length) return;

      // Draw climate polygons
      data.features.forEach((feature: any) => {
        this.drawPolygon(feature);
      });

    } catch (error) {
      console.error('Canvas overlay error:', error);
    }
  }

  drawPolygon(feature: any) {
    if (!this.map || !feature.geometry?.coordinates) return;

    const color = feature.properties?.color || '#FF4444';
    const opacity = feature.properties?.opacity || 0.6;

    this.ctx.fillStyle = this.hexToRgba(color, opacity);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    // Handle different geometry types
    const coords = feature.geometry.coordinates;
    
    if (feature.geometry.type === 'Polygon') {
      this.drawPolygonRing(coords[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      coords.forEach((polygon: any) => {
        this.drawPolygonRing(polygon[0]);
      });
    }
  }

  drawPolygonRing(ring: number[][]) {
    if (!this.map || ring.length === 0) return;

    this.ctx.beginPath();
    
    ring.forEach((coord, index) => {
      const point = this.map!.project([coord[0], coord[1]]);
      
      if (index === 0) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    });
    
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}