"use client"

export function ChartContainer({ children, className, ...props }) {
    return (
        <div className="min-h-[350px] w-full" {...props}>
            {children}
        </div>
    )
} 