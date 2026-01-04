import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onValueChange?: (value: number) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min, max, step, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onValueChange?.(Number(e.target.value))
    }

    // Calculate percentage for filled track
    const numValue = Number(value) || Number(min) || 0
    const numMin = Number(min) || 0
    const numMax = Number(max) || 100
    const percentage = ((numValue - numMin) / (numMax - numMin)) * 100

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          className={cn(
            "absolute w-full h-4 cursor-pointer opacity-0",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4"
          )}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <div
          className="absolute h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
