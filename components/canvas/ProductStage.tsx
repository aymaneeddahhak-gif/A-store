"use client"

import { Float, ContactShadows, Environment, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"

type GroupProps = React.ComponentProps<'group'>
import * as THREE from "three"

interface ProductStageProps extends GroupProps {
    category?: string
    color?: string
    image?: string
}

export function ProductStage({ category = "Electronics", color = "#c0c0c0", image, ...props }: ProductStageProps) {
    const meshRef = useRef<THREE.Mesh>(null!)

    // Load Texture if image provided
    const texture = useTexture(image || '/images/product-1.png')

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Spin logic
            meshRef.current.rotation.y += delta * 0.5
        }
    })

    return (
        <group {...props}>
            <Environment preset="city" />

            <Float speed={4} rotationIntensity={0.5} floatIntensity={1}>
                <mesh ref={meshRef}>
                    {/* A flat plane 1x1, standard for images */}
                    <planeGeometry args={[2, 2]} />
                    <meshStandardMaterial
                        map={texture}
                        transparent
                        roughness={0.4}
                        metalness={0.5}
                        side={THREE.DoubleSide} // Visible from back too
                    />
                </mesh>
            </Float>

            <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2.5} />
        </group>
    )
}

// Preload standard textures to avoid initial pop-in
;['/images/product-1.png', '/images/product-2.png', '/images/product-3.png', '/images/product-4.png'].forEach(img => useTexture.preload(img))
