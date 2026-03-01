import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  terrainType?: 'mountain' | 'valley' | 'plains' | 'forest' | 'desert';
}

// A simplified Three.js scene for property visualization
const ThreeScene = ({ terrainType = 'mountain' }: ThreeSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Dark background
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 30, 100);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Create terrain based on type
    const terrain = createTerrain(terrainType);
    scene.add(terrain);
    
    // Simple animation
    let rotationSpeed = 0.002;
    const animate = () => {
      requestAnimationFrame(animate);
      
      terrain.rotation.y += rotationSpeed;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [terrainType]);
  
  return <div ref={containerRef} className="w-full h-full" />;
};

// Create different terrain types
function createTerrain(type: string): THREE.Object3D {
  const group = new THREE.Group();
  
  // Base plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
  
  // Different terrain patterns based on type
  switch (type) {
    case 'mountain':
      createMountainTerrain(planeGeometry);
      break;
    case 'valley':
      createValleyTerrain(planeGeometry);
      break;
    case 'plains':
      createPlainsTerrain(planeGeometry);
      break;
    case 'forest':
      createForestTerrain(planeGeometry);
      break;
    case 'desert':
      createDesertTerrain(planeGeometry);
      break;
    default:
      createMountainTerrain(planeGeometry);
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: getTerrainColor(type),
    wireframe: false,
    flatShading: true
  });
  
  const plane = new THREE.Mesh(planeGeometry, material);
  plane.rotation.x = -Math.PI / 2;
  group.add(plane);
  
  // Add additional features based on terrain type
  addTerrainFeatures(group, type);
  
  return group;
}

function createMountainTerrain(geometry: THREE.PlaneGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    // Create peaks and valleys
    vertices[i + 1] = 
      15 * Math.sin(x / 10) * Math.cos(z / 10) +
      5 * Math.sin(x / 5) * Math.cos(z / 5) +
      Math.random() * 2;
  }
  
  geometry.computeVertexNormals();
}

function createValleyTerrain(geometry: THREE.PlaneGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    const dist = Math.sqrt(x * x + z * z);
    
    // Create a valley effect with higher edges
    vertices[i + 1] = Math.max(0, dist / 10 - 5) + Math.random();
  }
  
  geometry.computeVertexNormals();
}

function createPlainsTerrain(geometry: THREE.PlaneGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    // Just slight random variations
    vertices[i + 1] = Math.random() * 0.5;
  }
  
  geometry.computeVertexNormals();
}

function createForestTerrain(geometry: THREE.PlaneGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    // Gentle rolling hills
    vertices[i + 1] = 
      3 * Math.sin(x / 20) * Math.cos(z / 20) +
      Math.random() * 0.8;
  }
  
  geometry.computeVertexNormals();
}

function createDesertTerrain(geometry: THREE.PlaneGeometry) {
  const vertices = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    // Sand dune effect
    vertices[i + 1] = 
      2 * Math.sin(x / 15) * Math.sin(z / 15) +
      Math.random() * 0.3;
  }
  
  geometry.computeVertexNormals();
}

function getTerrainColor(type: string): THREE.Color {
  switch (type) {
    case 'mountain':
      return new THREE.Color(0x4D6D9A);
    case 'valley':
      return new THREE.Color(0x5B8C5A);
    case 'plains':
      return new THREE.Color(0x7DAA6A);
    case 'forest':
      return new THREE.Color(0x3B6D3A);
    case 'desert':
      return new THREE.Color(0xD6C48D);
    default:
      return new THREE.Color(0x4D6D9A);
  }
}

function addTerrainFeatures(group: THREE.Group, type: string) {
  switch (type) {
    case 'mountain':
      // Add a few mountain peaks
      for (let i = 0; i < 5; i++) {
        const peakGeometry = new THREE.ConeGeometry(5, 20, 4);
        const peakMaterial = new THREE.MeshStandardMaterial({
          color: 0xEEEEEE, // Snow-capped
          flatShading: true
        });
        
        const peak = new THREE.Mesh(peakGeometry, peakMaterial);
        peak.position.set(
          (Math.random() - 0.5) * 60,
          10,
          (Math.random() - 0.5) * 60
        );
        peak.rotation.y = Math.random() * Math.PI;
        group.add(peak);
      }
      break;
      
    case 'forest':
      // Add some trees
      for (let i = 0; i < 30; i++) {
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513, // Brown
          flatShading: true
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const leavesGeometry = new THREE.ConeGeometry(2, 6, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
          color: 0x2E8B57, // Green
          flatShading: true
        });
        
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5;
        
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        
        tree.position.set(
          (Math.random() - 0.5) * 80,
          0,
          (Math.random() - 0.5) * 80
        );
        
        group.add(tree);
      }
      break;
      
    case 'desert':
      // Add some cacti
      for (let i = 0; i < 10; i++) {
        const cactusGeometry = new THREE.CylinderGeometry(1, 1, 8, 8);
        const cactusMaterial = new THREE.MeshStandardMaterial({
          color: 0x2F4F2F, // Dark green
          flatShading: true
        });
        
        const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
        
        cactus.position.set(
          (Math.random() - 0.5) * 80,
          4,
          (Math.random() - 0.5) * 80
        );
        
        group.add(cactus);
      }
      break;
  }
}

export default ThreeScene;