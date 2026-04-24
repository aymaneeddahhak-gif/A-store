"use client"

import { Canvas } from "@react-three/fiber"
import { Preload, View } from "@react-three/drei"
import { Suspense } from "react"

export default function Scene({ ...props }) {
    return (
        <Canvas
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 30, // Sit on top of content to ensure visibility
            }}
            eventSource={typeof window !== "undefined" ? document.body : undefined}
            eventPrefix="client"
            {...props}
        >
            <View.Port />
            <Preload all />
            {/* Ambient Light for basic visibility */}
            <ambientLight intensity={0.5} />
            {/* Directional Light for depth */}
            <directionalLight position={[10, 10, 5]} intensity={1} />
        </Canvas>
    )
}
