"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Line } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function MeterCore() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      // gentle parallax toward the pointer
      const px = state.pointer.x * 0.25;
      const py = state.pointer.y * 0.18;
      group.current.rotation.x += (py - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (-px - group.current.rotation.z) * 0.04;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.22;
      inner.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* outer wireframe shell */}
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.35} />
      </mesh>
      {/* inner solid core, faint emissive */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          color="#0e0f0e"
          emissive="#10b981"
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.6}
          wireframe
        />
      </mesh>
    </group>
  );
}

function TickRing() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * 0.05;
  });

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0]);
    }
    return pts;
  }, []);

  return (
    <group ref={ref} rotation={[Math.PI / 2.4, 0, 0]}>
      <Line points={points} color="#1c2a20" lineWidth={1} transparent opacity={0.7} />
    </group>
  );
}

function Scene() {
  const { viewport } = useThree();
  const scale = Math.min(1, viewport.width / 8);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={40} color="#34d399" />
      <pointLight position={[-4, -2, -3]} intensity={12} color="#0e0f0e" />

      <group scale={scale}>
        <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
          <MeterCore />
        </Float>
        <TickRing />
      </group>

      <Sparkles count={70} scale={7} size={2} speed={0.25} color="#6ee7b7" opacity={0.5} />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
