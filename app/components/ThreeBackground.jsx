"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles } from "@react-three/drei";

function MovingStars() {
  const starsRef = useRef();
  const sparklesRef = useRef();

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y -= delta * 0.05;
      starsRef.current.rotation.x -= delta * 0.02;
    }
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Dense background stars */}
      <Stars ref={starsRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floating interactive colored particles */}
      <Sparkles 
        ref={sparklesRef}
        count={200} 
        scale={20} 
        size={2} 
        speed={0.4} 
        opacity={0.5} 
        color="#FFBE98" 
      />
      <Sparkles 
        count={100} 
        scale={20} 
        size={3} 
        speed={0.2} 
        opacity={0.3} 
        color="#F9A48C" 
      />
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={["#201B1A"]} />
        <ambientLight intensity={1} />
        <MovingStars />
      </Canvas>
    </div>
  );
}
