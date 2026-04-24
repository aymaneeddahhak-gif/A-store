"use client"

import { useEffect, useState } from "react"

export function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">("dark")

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute("data-theme", savedTheme)
        } else {
            document.documentElement.setAttribute("data-theme", "dark")
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        document.documentElement.setAttribute("data-theme", newTheme)
    }

    return { theme, toggleTheme }
}
