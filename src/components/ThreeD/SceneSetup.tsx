import { useMemo } from 'react';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import { MORANDI_GREIGE } from '../../utils/chartTheme';

/**
 * 场景光照系统
 */
export function SceneLights() {
  return (
    <>
      <ambientLight color="#EDE8DC" intensity={0.55} />
      <directionalLight
        color="#F5F0E8"
        intensity={0.7}
        position={[15, 30, 25]}
        castShadow={false}
      />
      <directionalLight
        color="#B0BEC5"
        intensity={0.25}
        position={[-15, 20, -10]}
      />
      <pointLight
        color={MORANDI_GREIGE}
        intensity={0.3}
        position={[0, 20, 0]}
        distance={100}
      />
    </>
  );
}

/**
 * 地面光晕
 */
export function GroundGlow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
    gradient.addColorStop(0, 'rgba(196,168,139,0.15)');
    gradient.addColorStop(0.5, 'rgba(196,168,139,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 70]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/**
 * 星空粒子背景
 */
export function StarField() {
  return (
    <Stars
      radius={100}
      depth={50}
      count={800}
      factor={4}
      saturation={0}
      fade
      speed={0.4}
    />
  );
}
