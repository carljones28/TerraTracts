declare module 'three' {
  export class Scene {
    constructor();
    add(object: Object3D): this;
    remove(object: Object3D): this;
    children: Object3D[];
    background: Color | null;
  }

  export class Color {
    constructor(color?: string | number);
    set(color: string | number): this;
  }

  export class PerspectiveCamera extends Object3D {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    fov: number;
    aspect: number;
    near: number;
    far: number;
    position: Vector3;
    lookAt(x: number | Vector3 | Object3D, y?: number, z?: number): this;
    updateProjectionMatrix(): void;
  }

  export class WebGLRenderer {
    constructor(parameters?: { antialias?: boolean, alpha?: boolean });
    setSize(width: number, height: number): void;
    setPixelRatio(ratio: number): void;
    setClearColor(color: Color | string | number, alpha?: number): void;
    domElement: HTMLCanvasElement;
    render(scene: Scene, camera: Camera): void;
  }

  export class AmbientLight extends Light {
    constructor(color?: string | number, intensity?: number);
  }

  export class DirectionalLight extends Light {
    constructor(color?: string | number, intensity?: number);
    position: Vector3;
  }

  export class Light extends Object3D {
    constructor(color?: string | number, intensity?: number);
    color: Color;
    intensity: number;
  }

  export class Group extends Object3D {
    constructor();
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
  }

  export class ConeGeometry extends BufferGeometry {
    constructor(radius?: number, height?: number, radialSegments?: number, heightSegments?: number);
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
      heightSegments?: number
    );
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: {
      color?: string | number | Color,
      roughness?: number,
      metalness?: number,
      side?: number,
      wireframe?: boolean,
      flatShading?: boolean
    });
    color: Color;
    roughness: number;
    metalness: number;
    wireframe: boolean;
    flatShading: boolean;
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material | Material[]);
    geometry: BufferGeometry;
    material: Material | Material[];
  }

  export class Material {
    constructor();
    transparent: boolean;
    opacity: number;
    side: number;
  }

  export class BufferGeometry {
    constructor();
    attributes: {
      position: any;
      [key: string]: any;
    };
    computeVertexNormals(): void;
  }

  export class Object3D {
    constructor();
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    parent: Object3D | null;
    children: Object3D[];
    visible: boolean;
    add(object: Object3D): this;
    remove(object: Object3D): this;
    rotateX(angle: number): this;
    rotateY(angle: number): this;
    rotateZ(angle: number): this;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }

  export enum Side {
    FrontSide,
    BackSide,
    DoubleSide
  }

  export type Camera = PerspectiveCamera;
}