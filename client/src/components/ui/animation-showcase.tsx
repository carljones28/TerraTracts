import React, { useState } from 'react';
import { AnimatedElement } from '@/components/ui/animated-element';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ANIMATIONS } from '@/lib/animations';
import { useStaggerAnimation } from '@/hooks/use-stagger-animation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  RefreshCw, 
  ArrowRight, 
  Plus, 
  Minus, 
  Check, 
  X, 
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface AnimationShowcaseProps {
  className?: string;
}

/**
 * A showcase component that demonstrates various animation capabilities
 */
const AnimationShowcase: React.FC<AnimationShowcaseProps> = ({ className = '' }) => {
  // Animation state
  const [selectedAnimation, setSelectedAnimation] = useState<string>(Object.keys(ANIMATIONS)[0]);
  const [hoverEffect, setHoverEffect] = useState<'scale' | 'lift' | 'glow' | 'pulse' | 'none'>('scale');
  const [clickEffect, setClickEffect] = useState<'press' | 'bounce' | 'ripple' | 'none'>('press');
  
  // Demo buttons
  const demoButtons = [
    { text: 'Explore Properties', icon: <ChevronRight /> },
    { text: 'Add Favorite', icon: <Plus /> },
    { text: 'Remove Filter', icon: <Minus /> },
    { text: 'Accept Offer', icon: <Check /> },
    { text: 'Decline Offer', icon: <X /> },
  ];
  
  // Staggered animation for the cards
  const { start: startCardAnimation, getItemProps } = useStaggerAnimation(demoButtons.length, {
    baseDelay: 100,
    staggerDelay: 80,
  });
  
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Animated Element Demo */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Animation Preview</CardTitle>
            <CardDescription>Try different animation effects</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center min-h-[200px]">
            <AnimatedElement
              animation={selectedAnimation}
              key={selectedAnimation}
              className="bg-primary/10 p-8 rounded-lg max-w-[300px]"
            >
              <div className="text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-medium mb-2">Animation Test</h3>
                <p className="text-sm text-muted-foreground">
                  This element is using the {selectedAnimation} animation
                </p>
              </div>
            </AnimatedElement>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <Label htmlFor="animation-select" className="mb-2 block">Select Animation:</Label>
              <Select 
                value={selectedAnimation} 
                onValueChange={(value) => setSelectedAnimation(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select animation" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ANIMATIONS).map((animation) => (
                    <SelectItem key={animation} value={animation}>
                      {animation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardFooter>
        </Card>
        
        {/* Button Animation Demo */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Button Micro-Interactions</CardTitle>
            <CardDescription>Explore different button interaction styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Hover Effect:</Label>
              <RadioGroup 
                value={hoverEffect} 
                onValueChange={(value) => setHoverEffect(value as any)}
                className="flex flex-wrap gap-2"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="scale" id="scale" />
                  <Label htmlFor="scale" className="ml-2">Scale</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="lift" id="lift" />
                  <Label htmlFor="lift" className="ml-2">Lift</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="glow" id="glow" />
                  <Label htmlFor="glow" className="ml-2">Glow</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="pulse" id="pulse" />
                  <Label htmlFor="pulse" className="ml-2">Pulse</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="none" id="none-hover" />
                  <Label htmlFor="none-hover" className="ml-2">None</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label className="mb-2 block">Click Effect:</Label>
              <RadioGroup 
                value={clickEffect} 
                onValueChange={(value) => setClickEffect(value as any)}
                className="flex flex-wrap gap-2"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="press" id="press" />
                  <Label htmlFor="press" className="ml-2">Press</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="bounce" id="bounce" />
                  <Label htmlFor="bounce" className="ml-2">Bounce</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="ripple" id="ripple" />
                  <Label htmlFor="ripple" className="ml-2">Ripple</Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="none" id="none-click" />
                  <Label htmlFor="none-click" className="ml-2">None</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="pt-4">
              <AnimatedButton 
                hoverEffect={hoverEffect} 
                clickEffect={clickEffect}
                className="w-full"
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Interactive Button
              </AnimatedButton>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Staggered Animation Demo */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Staggered Animations</CardTitle>
              <CardDescription>Elements appear sequentially with staggered timing</CardDescription>
            </div>
            <AnimatedButton 
              variant="outline" 
              size="sm"
              onClick={startCardAnimation}
              iconLeft={<RefreshCw className="h-4 w-4 mr-2" />}
            >
              Reset Animation
            </AnimatedButton>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoButtons.map((button, index) => {
              const itemProps = getItemProps(index);
              return (
                <div key={index} style={itemProps.style as React.CSSProperties}>
                  <AnimatedButton 
                    className="w-full justify-between"
                    variant={index % 2 === 0 ? 'default' : 'outline'}
                    iconRight={button.icon}
                    hoverEffect="lift"
                  >
                    {button.text}
                  </AnimatedButton>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AnimationShowcase };