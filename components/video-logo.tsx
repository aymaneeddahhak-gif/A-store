"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

interface VideoLogoProps {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    className?: string
}

export function VideoLogo({ size = "md", showText = true, className = "" }: VideoLogoProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Ensure playback works robustly on all browsers
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay blocked/interrupted, ignore
            })
        }
    }, [])

    const dimensions = {
        sm: "w-14 h-14",
        md: "w-20 h-20",
        lg: "w-32 h-32",
    }

    const currentSizeClass = dimensions[size]

    return (
        <Link 
            href="/" 
            className={`inline-flex items-center group select-none ${className}`}
            title="Go to Home"
        >
            {/* Endlessly playing 3D Holographic Lion Logo */}
            <div className={`relative ${currentSizeClass} shrink-0 transition-transform duration-500 group-hover:scale-110`}>
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster="/icon.svg"
                    className="w-full h-full object-cover mix-blend-screen scale-[1.05]"
                    src="/videos/welcome.mp4"
                />
            </div>
        </Link>
    )
}

