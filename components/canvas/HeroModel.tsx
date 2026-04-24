"use client"

import { Float, ContactShadows, Environment, PresentationControls, useTexture, Sparkles } from "@react-three/drei"
import { useRef } from "react"
import type * as THREE from "three"

export function HeroModel(props: any) {
    const meshRef = useRef<THREE.Mesh>(null!)
    // Load the product texture
    const texture = useTexture("/images/product-1.png")

    return (
        <group {...props}>
            <PresentationControls
                global
                config={{ mass: 2, tension: 500 }}
                snap={{ mass: 4, tension: 1500 }}
                rotation={[0, 0.3, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
                <Float
                    speed={2}
                    rotationIntensity={1}
                    floatIntensity={1}
                    floatingRange={[-0.1, 0.1]}
                >
                    {/* Product with texture */}
                    <mesh ref={meshRef} scale={3}>
                        {/* A thin box to give it some depth vs just a plane */}
                        <boxGeometry args={[1, 1, 0.1]} />
                        <meshPhysicalMaterial
                            map={texture}
                            transparent={true}
                            color="white"
                            metalness={0.1}
                            roughness={0.4}
                            clearcoat={0.8}
                            clearcoatRoughness={0.2}
                        />
                    </mesh>
                </Float>
            </PresentationControls>

            {/* Creative Elements: Sparkles */}
            <Sparkles count={50} scale={3} size={4} speed={0.4} opacity={0.5} color="#ffffff" />

            {/* Studio Lighting Environment */}
            <Environment preset="city" />

            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

            {/* Shadows for grounding */}
            <ContactShadows
                position={[0, -2, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4}
            />
        </group>
    )
}
