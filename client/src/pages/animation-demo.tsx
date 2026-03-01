import React, { useEffect } from 'react';
import { AnimationShowcase } from '@/components/ui/animation-showcase';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { Card, CardContent } from '@/components/ui/card';
import { ANIMATIONS, VARIANTS } from '@/lib/animations';
import { AnimatedElement } from '@/components/ui/animated-element';

/**
 * Animation showcase page displaying all the available animations
 */
const AnimationDemo = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ 
    threshold: 0.1,
    triggerOnce: true
  });
  
  // Set title
  useEffect(() => {
    document.title = "Animation Library - TerraNova Vision";
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div ref={headerRef} className={`space-y-4 mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
        <h1 className="text-4xl md:text-5xl font-bold">Micro-Interaction Animation Library</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          A collection of smooth animations and micro-interactions to enhance the user experience
          across the TerraNova Vision platform.
        </p>
      </div>
      
      {/* Sections navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a href="#animation-showcase" className={VARIANTS.BUTTON.COMBINED + " bg-primary text-white px-4 py-2 rounded-md"}>
          Animation Showcase
        </a>
        <a href="#scroll-animations" className={VARIANTS.BUTTON.COMBINED + " bg-primary/10 text-primary px-4 py-2 rounded-md"}>
          Scroll Animations
        </a>
        <a href="#hover-effects" className={VARIANTS.BUTTON.COMBINED + " bg-primary/10 text-primary px-4 py-2 rounded-md"}>
          Hover Effects
        </a>
        <a href="#card-animations" className={VARIANTS.BUTTON.COMBINED + " bg-primary/10 text-primary px-4 py-2 rounded-md"}>
          Card Animations
        </a>
      </div>
      
      {/* Main showcase */}
      <section id="animation-showcase" className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Interactive Showcase</h2>
        <AnimationShowcase />
      </section>
      
      {/* Card animations showcase */}
      <section id="card-animations" className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Card Interaction Effects</h2>
        <p className="text-muted-foreground mb-8">
          Interactive card elements with hover effects and animations to make content more engaging.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={VARIANTS.CARD.COMBINED + " overflow-hidden group"}>
            <CardContent className="p-6">
              <div className="relative mb-4 h-48 overflow-hidden rounded bg-muted">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <h3 className="font-medium">Hover Reveal Description</h3>
                  <p className="text-sm text-white/80">Information appears on hover</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Card with Hover Overlay</h3>
              <p className="text-sm text-muted-foreground">
                This card reveals additional information on hover with a smooth transition.
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="relative mb-4 h-48 overflow-hidden rounded bg-muted">
                <div className={`absolute inset-0 bg-primary/20 ${ANIMATIONS.SHIMMER}`} 
                  style={{ backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }}></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Shimmer Effect</h3>
              <p className="text-sm text-muted-foreground">
                This card demonstrates a continuous shimmer effect that can be used for loading states.
              </p>
            </CardContent>
          </Card>
          
          <Card className={VARIANTS.CARD.COMBINED}>
            <CardContent className="p-6">
              <div className="mb-4 h-48 overflow-hidden rounded bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={ANIMATIONS.BREATHE}>
                    <div className="h-16 w-16 rounded-full bg-primary/30 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-primary/60 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Breathing Animation</h3>
              <p className="text-sm text-muted-foreground">
                A subtle pulsing "breathing" animation that draws attention without being distracting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Scroll triggered animations */}
      <section id="scroll-animations" className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Scroll-Triggered Animations</h2>
        <p className="text-muted-foreground mb-8">
          Elements animate into view as the user scrolls down the page, creating a dynamic experience.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedElement animation="slideInLeft" className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Slide In From Left</h3>
            <p>This element slides in from the left as it enters the viewport.</p>
          </AnimatedElement>
          
          <AnimatedElement animation="slideInRight" className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Slide In From Right</h3>
            <p>This element slides in from the right as it enters the viewport.</p>
          </AnimatedElement>
          
          <AnimatedElement animation="fadeIn" delay={300} className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Fade In</h3>
            <p>This element fades in with a slight delay as it enters the viewport.</p>
          </AnimatedElement>
          
          <AnimatedElement animation="scaleIn" className="bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Scale In</h3>
            <p>This element scales in with a bouncy effect as it enters the viewport.</p>
          </AnimatedElement>
        </div>
      </section>
      
      {/* Hover effects */}
      <section id="hover-effects" className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Hover Micro-Interactions</h2>
        <p className="text-muted-foreground mb-8">
          Small, satisfying interactions that respond to user hover actions.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={VARIANTS.CARD.HOVER + " bg-muted p-4 rounded-lg text-center"}>
            <div className="h-20 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary">1</span>
              </div>
            </div>
            <p className="font-medium">Lift Effect</p>
            <p className="text-sm text-muted-foreground">Rises on hover</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-center group">
            <div className="h-20 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center 
              transition-transform duration-300 group-hover:rotate-12">
                <span className="font-bold text-primary">2</span>
              </div>
            </div>
            <p className="font-medium">Rotate Effect</p>
            <p className="text-sm text-muted-foreground">Rotates on hover</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-center group">
            <div className="h-20 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center 
              transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/40">
                <span className="font-bold text-primary group-hover:text-white transition-colors duration-300">3</span>
              </div>
            </div>
            <p className="font-medium">Color Shift</p>
            <p className="text-sm text-muted-foreground">Changes color on hover</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-center group overflow-hidden">
            <div className="h-20 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary">4</span>
              </div>
            </div>
            <div className="relative">
              <p className="font-medium">Reveal Effect</p>
              <p className="text-sm text-muted-foreground">Shows detail on hover</p>
              <div className="absolute inset-0 bg-primary text-white flex items-center justify-center 
              transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm">Hidden content!</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnimationDemo;