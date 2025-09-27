"use client"

import * as React from "react"
import { Moon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  return (
    <Button variant="outline" size="icon" className="h-9 w-9" disabled>
      <Moon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Dark theme active</span>
    </Button>
  )
}
