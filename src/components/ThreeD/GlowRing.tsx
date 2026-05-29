import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GlowRingProps {
  position: THREE.Vector3;
  delay?: number;
  color?: string;
}

export default function GlowRing({ position, delay = 0, color = '#D4CFC7' }: GlowRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(delay);

  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(0.02, 0.06, 32),
    []
  );

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [color]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    phaseRef.current += delta;
    // 周期 1.5s
    const t = (phaseRef.current % 1.5) / 1.5;
    const scale = 1.0 + t * 1.5; // 1.0 -> 2.5
    const opacity = Math.max(0, 0.5 * (1 - t)); // 0.5 -> 0

    meshRef.current.scale.setScalar(scale);
    meshRef.current.position.copy(position);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
  });

  return (
    <mesh ref={meshRef} geometry={ringGeometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
  );
}
