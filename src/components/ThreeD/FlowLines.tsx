import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { projectTo3D } from '../../utils/projection';
import GlowRing from './GlowRing';
import type { FlowLine } from '../../types';

interface FlowLinesProps {
  flows: FlowLine[];
  visible: boolean;
}

export default function FlowLines({ flows, visible }: FlowLinesProps) {
  if (!visible || flows.length === 0) return null;

  return (
    <group>
      {flows.map((flow, i) => (
        <SingleFlowLine key={i} flow={flow} index={i} />
      ))}
    </group>
  );
}

function SingleFlowLine({ flow, index }: { flow: FlowLine; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { tubeGeometry, startPos, endPos } = useMemo(() => {
    const start = projectTo3D(flow.from[0], flow.from[1], 0.6);
    const end = projectTo3D(flow.to[0], flow.to[1], 0.6);
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);

    const mid = startV.clone().add(endV).multiplyScalar(0.5);
    const dist3D = startV.distanceTo(endV);
    mid.z += dist3D * 0.6; // 弧线向上拱起，高度与投影距离成比例

    const curve = new THREE.QuadraticBezierCurve3(startV, mid, endV);
    const width = 0.02 + (flow.value / 100) * 0.07;
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, width, 8, false);

    return { tubeGeometry, startPos: startV, endPos: endV };
  }, [flow.from[0], flow.from[1], flow.to[0], flow.to[1], flow.value]);

  const flowColor = useMemo(() => {
    if (flow.color) return flow.color;
    const hue = 0.1 + flow.value * 0.0005;
    const saturation = 0.15;
    const lightness = 0.55 + flow.value * 0.001;
    return '#' + new THREE.Color().setHSL(hue, saturation, lightness).getHexString();
  }, [flow.value, flow.color]);

  const shaderMaterial = useMemo(() => {
    const color = new THREE.Color(flowColor);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          float alpha = 0.25 + 0.35 * sin(vUv.x * 10.0 - uTime * 2.0);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    // 同步到 ref，供 useFrame 更新 uTime
    materialRef.current = mat;
    return mat;
  }, [flowColor]);

  // 动画更新：驱动流动效果
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={tubeGeometry} material={shaderMaterial} />
      <GlowRing position={startPos} delay={index * 0.3} color={flowColor} />
      <GlowRing position={endPos} delay={index * 0.3 + 0.75} color={flowColor} />
    </group>
  );
}
