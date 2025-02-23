import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react";

const marqueeBadgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground",
                outline: "text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const MarqueeBadge = ({ text, className, variant, ...props }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current) {
                const textWidth = textRef.current.scrollWidth;
                const maxWidth = 120;
                // More aggressive overflow detection
                setIsOverflowing(textWidth > maxWidth * 0.8); // Trigger animation at 80% of max width
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    return (
        <div
            className={cn(
                marqueeBadgeVariants({ variant }),
                "max-w-[120px] min-w-[40px] overflow-hidden", // Match maxWidth
                className
            )}
            {...props}
        >
            <div
                ref={textRef}
                className="whitespace-nowrap w-fit"
            >
                {isOverflowing ? (
                    <div
                        className="animate-[marquee_15s_linear_infinite]"
                        style={{ paddingLeft: '20px' }} // Reduced initial padding
                    >
                        <span>{text}</span>
                        <span className="pl-4">{text}</span>
                    </div>
                ) : (
                    <span className="truncate">{text}</span>
                )}
            </div>
        </div>
    );
};

export { MarqueeBadge, marqueeBadgeVariants } 