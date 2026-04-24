"use client"

import * as THREE from "three"
import { extend, ReactThreeFiber, useFrame } from "@react-three/fiber"
import { shaderMaterial } from "@react-three/drei"
import React, { useRef } from "react"

// --- GLSL SHADERS ---

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uIntensity;
  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    
    // Create a border mask (0 in center, 1 at edges)
    float borderWidth = 0.05; // Adjust thickness
    float maskX = step(uv.x, borderWidth) + step(1.0 - borderWidth, uv.x);
    float maskY = step(uv.y, borderWidth) + step(1.0 - borderWidth, uv.y);
    float isBorder = clamp(maskX + maskY, 0.0, 1.0);

    // If not border, discard early (transparency)
    if (isBorder < 0.1) discard;

    // Displacement Logic
    // We displace the position lookup for the noise
    float t = uTime * uSpeed;
    float noise = snoise(uv * 10.0 + vec2(0.0, t)); // Vertical flow logic
    
    // Intensity modulation
    float glow = smoothstep(0.3, 0.8, noise * 0.5 + 0.5);
    
    // Output
    vec3 finalColor = uColor * glow * uIntensity;
    float alpha = glow * isBorder;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

// --- MATERIAL DEFINITION ---

const ElectricMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#c0c0c0"), // Silver default
        uSpeed: 1.0,
        uIntensity: 2.0,
    },
    vertexShader,
    fragmentShader
)

// Extend explicitly for type safety
extend({ ElectricMaterial })

// Add to JSX Intrinsic Elements
declare global {
    namespace JSX {
        interface IntrinsicElements {
            electricMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof ElectricMaterial>
        }
    }
}

// --- COMPONENT ---

import { easing } from "maath"

export function ShaderBorder({ color = "#c0c0c0", speed = 1, intensity = 2, ...props }) {
    const materialRef = useRef<THREE.ShaderMaterial>(null!)

    useFrame((state, delta) => {
        if (materialRef.current) {
            // Continuous time update
            materialRef.current.uniforms.uTime.value += delta

            // Smooth transitions for interaction props
            easing.damp(materialRef.current.uniforms.uSpeed, "value", speed, 0.25, delta)
            easing.damp(materialRef.current.uniforms.uIntensity, "value", intensity, 0.25, delta)
            easing.dampC(materialRef.current.uniforms.uColor.value, color, 0.25, delta)
        }
    })

    return (
        <mesh {...props}>
            <planeGeometry args={[1, 1, 32, 32]} />
            <electricMaterial
                ref={materialRef}
                uColor={color}
                uSpeed={speed}
                uIntensity={intensity}
                transparent
            />
        </mesh>
    )
}
