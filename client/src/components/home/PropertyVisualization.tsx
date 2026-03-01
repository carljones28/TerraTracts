import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useToast } from '@/hooks/use-toast';
import { generateRiskAnalysis } from '@/lib/openai';

const PropertyVisualization = () => {
  const visualizationRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [riskAnalysis, setRiskAnalysis] = useState<any>({
    risks: [],
    summary: "Loading risk analysis...",
    recommendations: [],
    getRiskColor: (level: string) => {
      switch (level.toLowerCase()) {
        case 'high':
          return 'text-red-500';
        case 'medium':
        case 'moderate':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-neutral-300';
      }
    }
  });
  
  // Sample property for demonstration
  const property = {
    id: 4,
    title: "Aspen Ridge Property",
    description: "Expansive land with mountain views and hunting potential.",
    price: 425000,
    size: 47.2,
    location: "Bozeman, Montana",
    state: "Montana",
    coordinates: [45.676, -111.042],
    features: ["Mountain", "Hunting", "Views"],
    images: [
      "https://images.unsplash.com/photo-1469122312224-c5846569feb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    ],
    isFeatured: false,
    propertyType: "Mountain",
    valueTrend: 4.7,
    risks: [
      { type: "Flood", level: "Moderate" },
      { type: "Slope", level: "Moderate" }
    ]
  };
  
  // Fetch risk analysis
  useEffect(() => {
    async function fetchRiskAnalysis() {
      try {
        const analysis = await generateRiskAnalysis(property);
        setRiskAnalysis(analysis);
      } catch (error) {
        console.error("Error fetching risk analysis:", error);
      }
    }
    
    fetchRiskAnalysis();
  }, []);
  
  // Initialize a simple Three.js scene
  useEffect(() => {
    if (visualizationRef.current) {
      // Create a simple Three.js scene
      const scene = new THREE.Scene();
      
      // Create a camera
      const camera = new THREE.PerspectiveCamera(
        75, 
        visualizationRef.current.clientWidth / visualizationRef.current.clientHeight, 
        0.1, 
        1000
      );
      camera.position.z = 5;
      
      // Create a renderer
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true 
      });
      renderer.setSize(visualizationRef.current.clientWidth, visualizationRef.current.clientHeight);
      visualizationRef.current.appendChild(renderer.domElement);
      
      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);
      
      // Create terrain based on property type
      let terrainGeometry: THREE.BufferGeometry;
      
      // Create a simple plane geometry for the terrain
      terrainGeometry = new THREE.PlaneGeometry(10, 10, 64, 64);
      // Rotate it to be horizontal
      terrainGeometry.rotateX(-Math.PI / 2);
      
      // Add random heights to create a terrain effect
      const positionAttribute = terrainGeometry.getAttribute('position');
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        
        // Skip the edges
        if (Math.abs(x) < 4.8 && Math.abs(y) < 4.8) {
          // Add some height variation based on position
          const height = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 + 
                        Math.random() * 0.2;
          positionAttribute.setZ(i, height);
        }
      }
      
      terrainGeometry.computeVertexNormals();
      
      const terrainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x10b981,
        wireframe: false,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
      scene.add(terrainMesh);
      
      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        
        terrainMesh.rotation.y += 0.001;
        
        renderer.render(scene, camera);
      }
      
      animate();
      
      return () => {
        // Clean up Three.js scene
        while (visualizationRef.current?.firstChild) {
          visualizationRef.current.removeChild(visualizationRef.current.firstChild);
        }
      };
    }
  }, []);
  
  const handleGenerateRender = () => {
    toast({
      title: "Generating 3D Render",
      description: "Your 3D render is being generated. This may take a moment.",
    });
    
    // Simulate processing time
    setTimeout(() => {
      toast({
        title: "3D Render Complete",
        description: "Your 3D render has been generated and is ready to view.",
      });
    }, 3000);
  };
  
  const handleViewReport = () => {
    toast({
      title: "Full Report",
      description: "The full property report will be available in a future update.",
    });
  };

  return (
    <section className="py-16 bg-primary-light relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 parallax-bg">
        {/* This would be a topographic pattern in the background */}
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center bg-glass rounded-full px-4 py-1 mb-4">
              <div className="h-2 w-2 rounded-full bg-accent mr-2 animate-pulse"></div>
              <span className="text-sm">DroneFly™ Technology</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-6">Visualize Your Future Property</h2>
            <p className="text-neutral-light mb-6">
              Experience AI-generated drone footage simulations that let you explore land from every angle, even from thousands of miles away.
            </p>
            
            <div className="bg-glass rounded-xl p-4 mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary-lighter flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-warning"></i>
                </div>
                <div>
                  <h4 className="text-white font-medium">Risk Analyzer</h4>
                  <p className="text-sm text-neutral-light">{riskAnalysis.summary}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {property.risks.map((risk, index) => (
                  <div key={index} className="flex items-center bg-primary rounded-lg px-3 py-1.5">
                    <i className={`fas fa-${risk.type === 'Flood' ? 'water' : risk.type === 'Slope' ? 'mountain' : 'exclamation-circle'} ${riskAnalysis.getRiskColor(risk.level)} mr-2 text-sm`}></i>
                    <span className="text-sm">{risk.type}: {risk.level}</span>
                  </div>
                ))}
                <div className="flex items-center bg-primary rounded-lg px-3 py-1.5">
                  <i className="fas fa-road text-success mr-2 text-sm"></i>
                  <span className="text-sm">Access: Good</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                className="bg-secondary hover:bg-secondary-light rounded-lg px-6 py-3 text-primary font-medium transition-colors flex items-center"
                onClick={handleGenerateRender}
              >
                <span>Generate 3D Render</span>
                <i className="fas fa-cube ml-2"></i>
              </button>
              <button 
                className="bg-primary hover:bg-primary-lighter rounded-lg px-6 py-3 text-white transition-colors flex items-center"
                onClick={handleViewReport}
              >
                <span>View Full Report</span>
                <i className="fas fa-file-alt ml-2"></i>
              </button>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="relative rounded-xl overflow-hidden shadow-card">
              <div ref={visualizationRef} className="w-full h-[400px] bg-[#0c1424]">
                {/* Three.js visualization will be rendered here */}
              </div>
              
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
                  <i className="fas fa-expand text-white"></i>
                </button>
                <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
                  <i className="fas fa-play text-white"></i>
                </button>
                <button className="bg-glass p-2 rounded-lg hover:bg-primary-lighter transition-colors">
                  <i className="fas fa-camera text-white"></i>
                </button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-transparent py-8 px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-display font-semibold">{property.title}</h3>
                  <div className="flex items-center space-x-3">
                    <button className="bg-glass rounded-full p-2">
                      <i className="fas fa-angle-left text-white"></i>
                    </button>
                    <button className="bg-glass rounded-full p-2">
                      <i className="fas fa-angle-right text-white"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyVisualization;
