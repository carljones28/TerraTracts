import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VirtualDevelopmentResponse } from '@/lib/openai';

// Import BufferGeometry only
import { BufferGeometry } from 'three';

// Create custom geometries to avoid THREE namespace issues
// NOTE: THREE v0.175.0 has changed how geometries are exported
const createBoxGeometry = (width: number, height: number, depth: number, 
                          widthSegments?: number, heightSegments?: number, depthSegments?: number) => {
  return new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
};

const createIcosahedronGeometry = (radius: number, detail: number) => {
  return new THREE.IcosahedronGeometry(radius, detail);
};

const createSphereGeometry = (radius: number, widthSegments?: number, heightSegments?: number) => {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
};

const createDodecahedronGeometry = (radius: number, detail: number) => {
  return new THREE.DodecahedronGeometry(radius, detail);
};

interface Development3DSceneProps {
  concept: VirtualDevelopmentResponse | null;
  terrainType?: 'mountain' | 'valley' | 'plains' | 'forest' | 'desert';
  developmentType?: string;
}

const Development3DScene: React.FC<Development3DSceneProps> = ({ 
  concept, 
  terrainType = 'forest',
  developmentType = 'cabin'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !concept) return;
    
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
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Create terrain
    const terrain = createSimpleTerrain(terrainType);
    scene.add(terrain);
    
    // Add simple development structures
    const structures = createSimpleStructures(concept, developmentType, terrainType);
    scene.add(structures);
    
    // Add orbit controls
    let rotationSpeed = 0.001;
    let autoRotate = true;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (autoRotate) {
        terrain.rotation.y += rotationSpeed;
        structures.rotation.y += rotationSpeed;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Toggle auto-rotation on click
    const handleClick = () => {
      autoRotate = !autoRotate;
    };
    
    containerRef.current.addEventListener('click', handleClick);
    
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
        containerRef.current.removeEventListener('click', handleClick);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [concept, terrainType, developmentType]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-[400px] rounded-lg overflow-hidden relative"
      style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)' }}
    >
      {!concept && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-dark/50 text-white text-lg">
          No development concept available
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-xs text-white opacity-70 bg-primary-dark/50 px-2 py-1 rounded">
        Click to toggle rotation
      </div>
    </div>
  );
};

// Create simple terrain based on type
function createSimpleTerrain(type: string): THREE.Object3D {
  const group = new THREE.Group();
  
  // Create base plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
  
  // Add terrain variations based on type
  const vertices = planeGeometry.attributes.position.array as Float32Array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    
    // Vary height based on terrain type
    switch (type) {
      case 'mountain':
        vertices[i + 1] = 10 * Math.sin(x / 10) * Math.cos(z / 10) + Math.random() * 2;
        break;
      case 'valley':
        const dist = Math.sqrt(x * x + z * z);
        vertices[i + 1] = Math.max(0, dist / 10 - 5) + Math.random();
        break;
      case 'plains':
        vertices[i + 1] = Math.random() * 0.5;
        break;
      case 'desert':
        vertices[i + 1] = 2 * Math.sin(x / 15) * Math.sin(z / 15) + Math.random() * 0.3;
        break;
      case 'forest':
      default:
        vertices[i + 1] = 3 * Math.sin(x / 20) * Math.cos(z / 20) + Math.random() * 0.8;
    }
  }
  
  planeGeometry.computeVertexNormals();
  
  // Create material based on terrain type
  const terrainColor = type === 'mountain' ? 0x4D6D9A : 
                      type === 'valley' ? 0x5B8C5A :
                      type === 'plains' ? 0x7DAA6A :
                      type === 'desert' ? 0xD6C48D : 0x3B6D3A; // forest default
  
  const material = new THREE.MeshStandardMaterial({
    color: terrainColor,
    flatShading: true
  });
  
  const plane = new THREE.Mesh(planeGeometry, material);
  plane.rotation.x = -Math.PI / 2;
  group.add(plane);
  
  return group;
}

// Create simple 3D structures based on the concept
function createSimpleStructures(concept: VirtualDevelopmentResponse, developmentType: string, terrainType: string): THREE.Object3D {
  const group = new THREE.Group();
  
  if (!concept.structures || concept.structures.length === 0) {
    return group;
  }
  
  // Create building materials based on development type
  const buildingColor = developmentType === 'cabin' ? 0x8B4513 :
                        developmentType === 'eco_retreat' ? 0x2E8B57 :
                        developmentType === 'conservation' ? 0x3B6D3A :
                        developmentType === 'estate' ? 0xA0522D : 0x708090; // commercial default
  
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: buildingColor,
    flatShading: true
  });
  
  // Add structures from the concept
  concept.structures.forEach(structure => {
    // Convert normalized coordinates (0-1) to 3D space
    const x = (structure.position[0] - 0.5) * 80;
    const z = (structure.position[1] - 0.5) * 80;
    
    // Size is also normalized
    const width = structure.size[0] * 30;
    const depth = structure.size[1] * 30;
    
    // Create different types of structures
    if (structure.type === 'building') {
      // Building height based on development type
      const height = developmentType === 'commercial' ? 15 :
                     developmentType === 'estate' ? 12 : 8;
      
      // Create a building group to hold all building elements
      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(x, 0, z);
      
      // Enhanced building material with textured appearance
      const buildingColor = developmentType === 'commercial' ? 0x708090 :
                           developmentType === 'eco_retreat' ? 0x8D9E62 :
                           developmentType === 'cabin' ? 0xA0522D : 0xE0E0E0;
      
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: buildingColor,
        flatShading: true,
        roughness: 0.7,
        metalness: 0.1
      });
      
      // Create actual 3D structure with walls
      // Create front wall
      const frontWallGeometry = new THREE.PlaneGeometry(width, height);
      const frontWall = new THREE.Mesh(frontWallGeometry, buildingMaterial);
      frontWall.position.set(0, height/2, depth/2);
      buildingGroup.add(frontWall);
      
      // Create back wall
      const backWallGeometry = new THREE.PlaneGeometry(width, height);
      const backWall = new THREE.Mesh(backWallGeometry, buildingMaterial);
      backWall.position.set(0, height/2, -depth/2);
      backWall.rotation.y = Math.PI;
      buildingGroup.add(backWall);
      
      // Create left wall
      const sideWallGeometry = new THREE.PlaneGeometry(depth, height);
      const leftWall = new THREE.Mesh(sideWallGeometry, buildingMaterial);
      leftWall.position.set(-width/2, height/2, 0);
      leftWall.rotation.y = Math.PI / 2;
      buildingGroup.add(leftWall);
      
      // Create right wall
      const rightWallGeometry = new THREE.PlaneGeometry(depth, height);
      const rightWall = new THREE.Mesh(rightWallGeometry, buildingMaterial);
      rightWall.position.set(width/2, height/2, 0);
      rightWall.rotation.y = -Math.PI / 2;
      buildingGroup.add(rightWall);
      
      // Create floor
      const floorGeometry = new THREE.PlaneGeometry(width, depth);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x5D4037,
        roughness: 0.9,
        metalness: 0
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.set(0, 0.25, 0);
      buildingGroup.add(floor);
      
      // Add windows for buildings
      if (developmentType === 'commercial' || developmentType === 'estate') {
        const windowMaterial = new THREE.MeshStandardMaterial({
          color: 0xADD8E6,
          metalness: 0.9,
          roughness: 0.1
        });
        windowMaterial.transparent = true;
        windowMaterial.opacity = 0.7;
        
        // Window dimensions
        const windowSize = width / 8;
        const windowHeight = height / 5;
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowHeight);
        
        // Add windows to front wall
        const windowRowCount = developmentType === 'commercial' ? 3 : 2;
        const windowColCount = developmentType === 'commercial' ? 4 : 3;
        const spacingX = width / (windowColCount + 1);
        const spacingY = height / (windowRowCount + 1);
        
        // Front windows
        for (let wx = 1; wx <= windowColCount; wx++) {
          for (let wy = 1; wy <= windowRowCount; wy++) {
            const windowX = -width/2 + wx * spacingX;
            const windowY = wy * spacingY;
            
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(windowX, windowY, depth/2 + 0.1);
            buildingGroup.add(window);
          }
        }
        
        // Back windows (fewer windows in the back)
        for (let wx = 1; wx <= windowColCount-1; wx++) {
          for (let wy = 1; wy <= windowRowCount-1; wy++) {
            const windowX = -width/2 + wx * spacingX * 1.5;
            const windowY = wy * spacingY * 1.2;
            
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(windowX, windowY, -depth/2 - 0.1);
            window.rotation.y = Math.PI;
            buildingGroup.add(window);
          }
        }
      }
      
      // Enhanced roof for different building types
      if (developmentType === 'cabin' || developmentType === 'eco_retreat') {
        // Sloped roof for cabins and eco retreats
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B0000,
          flatShading: true,
          roughness: 0.8
        });
        
        // Create a peaked roof
        const roofHeight = height * 0.4;
        
        // Left roof panel
        const roofLeftGeometry = new THREE.PlaneGeometry(width, Math.sqrt((width/2)*(width/2) + roofHeight*roofHeight));
        const roofLeft = new THREE.Mesh(roofLeftGeometry, roofMaterial);
        roofLeft.rotation.x = -Math.atan2(roofHeight, width/2);
        roofLeft.rotation.y = Math.PI / 2;
        roofLeft.position.set(-width/4, height + roofHeight/2, 0);
        
        // Right roof panel
        const roofRightGeometry = new THREE.PlaneGeometry(width, Math.sqrt((width/2)*(width/2) + roofHeight*roofHeight));
        const roofRight = new THREE.Mesh(roofRightGeometry, roofMaterial);
        roofRight.rotation.x = Math.atan2(roofHeight, width/2);
        roofRight.rotation.y = Math.PI / 2;
        roofRight.position.set(width/4, height + roofHeight/2, 0);
        
        buildingGroup.add(roofLeft);
        buildingGroup.add(roofRight);
        
        // Add a chimney
        const chimneyGeometry = new THREE.BoxGeometry(1.5, 2.5, 1.5);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
          color: 0x726255,
          roughness: 1.0
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(width/4, height + roofHeight + 1, depth/4);
        buildingGroup.add(chimney);
        
        // Add smoke particles effect from chimney if it's cabin
        if (developmentType === 'cabin') {
          const smokeParticles = new THREE.Group();
          
          for (let i = 0; i < 5; i++) {
            const smokeGeometry = new THREE.IcosahedronGeometry(0.5, 1);
            const smokeMaterial = new THREE.MeshStandardMaterial({
              color: 0xDDDDDD,
              roughness: 1,
              metalness: 0
            });
            smokeMaterial.transparent = true;
            smokeMaterial.opacity = 0.4 - (i * 0.05);
            
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(
              width/4 + (Math.random() - 0.5),
              height + roofHeight + 3 + (i * 1.5),
              depth/4 + (Math.random() - 0.5)
            );
            smoke.scale.set(1 + i*0.5, 1 + i*0.5, 1 + i*0.5);
            
            smokeParticles.add(smoke);
          }
          
          buildingGroup.add(smokeParticles);
        }
      } else if (developmentType === 'commercial') {
        // Flat roof for commercial buildings with edge details
        const roofGeometry = new THREE.BoxGeometry(width + 1, 1, depth + 1);
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.9
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height + 0.5, 0);
        buildingGroup.add(roof);
        
        // Add roof details like AC units, antennas, etc.
        const acUnitGeometry = new THREE.BoxGeometry(3, 1.5, 2);
        const acUnitMaterial = new THREE.MeshStandardMaterial({
          color: 0x777777
        });
        
        const acUnit1 = new THREE.Mesh(acUnitGeometry, acUnitMaterial);
        acUnit1.position.set(width/4, height + 1.5, depth/3);
        buildingGroup.add(acUnit1);
        
        const acUnit2 = new THREE.Mesh(acUnitGeometry, acUnitMaterial);
        acUnit2.position.set(-width/5, height + 1.5, -depth/4);
        buildingGroup.add(acUnit2);
      }
      
      // Add the building group to main group
      group.add(buildingGroup);
    } 
    else if (structure.type === 'natural') {
      // Create a natural elements group
      const naturalGroup = new THREE.Group();
      naturalGroup.position.set(x, 0, z);
      
      // Determine the type of natural elements based on component prop
      const isForest = terrainType === 'forest';
      const isMountain = terrainType === 'mountain';
      const isDesert = terrainType === 'desert';
      
      // Add varied trees and plants based on terrain type
      const treeCount = isForest ? 10 : (isMountain ? 5 : 3);
      
      for (let i = 0; i < treeCount; i++) {
        // Random position within the area
        const treeX = (Math.random() - 0.5) * width;
        const treeZ = (Math.random() - 0.5) * depth;
        
        // Create tree group
        const treeGroup = new THREE.Group();
        treeGroup.position.set(treeX, 0, treeZ);
        
        if (isForest) {
          // Create detailed forest trees
          // Tree trunk with better appearance
          const trunkHeight = 4 + Math.random() * 2;
          const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, trunkHeight, 8);
          const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
          });
          
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = trunkHeight / 2;
          treeGroup.add(trunk);
          
          // Multiple tree top layers for more realistic trees
          const treeColor = Math.random() > 0.3 ? 0x2E8B57 : 0x3a9065;
          const leafMaterial = new THREE.MeshStandardMaterial({
            color: treeColor,
            flatShading: true,
            roughness: 0.8
          });
          
          const topSize = 2.5 + Math.random() * 1.5;
          
          // Bottom layer of leaves - wider
          const topGeometry1 = new THREE.ConeGeometry(topSize * 1.2, 4, 8);
          const top1 = new THREE.Mesh(topGeometry1, leafMaterial);
          top1.position.y = trunkHeight + 0.5;
          treeGroup.add(top1);
          
          // Middle layer of leaves
          const topGeometry2 = new THREE.ConeGeometry(topSize, 3.5, 8);
          const top2 = new THREE.Mesh(topGeometry2, leafMaterial);
          top2.position.y = trunkHeight + 3;
          treeGroup.add(top2);
          
          // Top layer of leaves - narrower
          const topGeometry3 = new THREE.ConeGeometry(topSize * 0.7, 3, 8);
          const top3 = new THREE.Mesh(topGeometry3, leafMaterial);
          top3.position.y = trunkHeight + 5.5;
          treeGroup.add(top3);
        } 
        else if (isMountain) {
          // Create pine trees for mountains
          const trunkHeight = 5 + Math.random() * 3;
          const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 8);
          const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D4037,
            flatShading: true
          });
          
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = trunkHeight / 2;
          treeGroup.add(trunk);
          
          // Pine tree layers
          const pineColor = 0x1B5E20;
          const pineMaterial = new THREE.MeshStandardMaterial({
            color: pineColor,
            flatShading: true
          });
          
          // Multiple cone layers for pine tree
          const layers = 4 + Math.floor(Math.random() * 3);
          const baseSize = 2.5;
          const layerHeight = 1.8;
          
          for (let l = 0; l < layers; l++) {
            const layerSize = baseSize * (1 - l / layers * 0.7);
            const coneGeometry = new THREE.ConeGeometry(layerSize, layerHeight, 8);
            const cone = new THREE.Mesh(coneGeometry, pineMaterial);
            cone.position.y = trunkHeight - l * (layerHeight * 0.6);
            treeGroup.add(cone);
          }
        }
        else if (isDesert) {
          // Create cacti for desert
          const cactusHeight = 3 + Math.random() * 2;
          const cactusGeometry = new THREE.CylinderGeometry(0.5, 0.7, cactusHeight, 8);
          const cactusMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            flatShading: true,
            roughness: 0.9
          });
          
          const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
          cactus.position.y = cactusHeight / 2;
          treeGroup.add(cactus);
          
          // Add cactus arms
          if (Math.random() > 0.3) {
            const armCount = 1 + Math.floor(Math.random() * 2);
            
            for (let a = 0; a < armCount; a++) {
              const armHeight = 1.5 + Math.random();
              const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, armHeight, 8);
              const arm = new THREE.Mesh(armGeometry, cactusMaterial);
              
              // Position and rotate the arm
              const angle = Math.random() * Math.PI * 2;
              const armY = 1 + Math.random() * (cactusHeight - 2);
              
              arm.position.set(
                0.7 * Math.cos(angle),
                armY,
                0.7 * Math.sin(angle)
              );
              
              arm.rotation.z = Math.PI / 2 - angle;
              treeGroup.add(arm);
            }
          }
        }
        else {
          // Default trees for other terrain types
          const trunkHeight = 3 + Math.random() * 2;
          const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, trunkHeight, 8);
          const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            flatShading: true
          });
          
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = trunkHeight / 2;
          treeGroup.add(trunk);
          
          // Simplified tree top
          const topGeometry = new THREE.SphereGeometry(2 + Math.random(), 8, 8);
          const topMaterial = new THREE.MeshStandardMaterial({
            color: 0x7CB342,
            flatShading: true
          });
          
          const top = new THREE.Mesh(topGeometry, topMaterial);
          top.position.y = trunkHeight + 1;
          treeGroup.add(top);
        }
        
        naturalGroup.add(treeGroup);
      }
      
      // Add ground details - rocks, bushes, etc.
      for (let i = 0; i < 8; i++) {
        const featureX = (Math.random() - 0.5) * width * 0.9;
        const featureZ = (Math.random() - 0.5) * depth * 0.9;
        
        if (Math.random() > 0.5) {
          // Create rocks
          const rockSize = 0.5 + Math.random() * 1.5;
          const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0); // Low poly rock
          const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
          });
          
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
          rock.position.set(featureX, rockSize / 2, featureZ);
          rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          
          naturalGroup.add(rock);
        } else {
          // Create bushes
          const bushSize = 0.7 + Math.random() * 1;
          const bushGeometry = new THREE.SphereGeometry(bushSize, 6, 6);
          const bushMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x4CAF50 : 0x388E3C,
            flatShading: true
          });
          
          const bush = new THREE.Mesh(bushGeometry, bushMaterial);
          bush.position.set(featureX, bushSize / 2, featureZ);
          
          naturalGroup.add(bush);
        }
      }
      
      // Add the natural group to the main group
      group.add(naturalGroup);
    }
    else if (structure.type === 'pathway' && structure.path && structure.path.length > 0) {
      // Simple pathway
      const pathMaterial = new THREE.MeshStandardMaterial({
        color: 0xA9A9A9,
        flatShading: true
      });
      
      // Create a simple path
      for (let i = 0; i < structure.path.length - 1; i++) {
        const startPoint = structure.path[i];
        const endPoint = structure.path[i + 1];
        
        const startX = (startPoint[0] - 0.5) * 80;
        const startZ = (startPoint[1] - 0.5) * 80;
        const endX = (endPoint[0] - 0.5) * 80;
        const endZ = (endPoint[1] - 0.5) * 80;
        
        // Calculate center and path segment direction
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;
        
        // Calculate path length
        const dx = endX - startX;
        const dz = endZ - startZ;
        const length = Math.sqrt(dx * dx + dz * dz);
        
        // Create path segment using a simple plane
        const pathSegment = new THREE.PlaneGeometry(length, 2);
        const path = new THREE.Mesh(pathSegment, pathMaterial);
        
        // Position at center
        path.position.set(centerX, 0.1, centerZ);
        
        // Apply rotations - make it horizontal and align with path direction
        path.rotation.x = -Math.PI / 2; // Make it horizontal
        const angle = Math.atan2(dz, dx);
        path.rotation.y = angle;
        
        group.add(path);
      }
    }
  });
  
  return group;
}

export default Development3DScene;