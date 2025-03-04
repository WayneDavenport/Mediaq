'use client';

import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function AffiliateDisclosure({ minimal = false }) {
    if (minimal) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Affiliate Link
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                            We may earn a commission for purchases made through this link.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                Affiliate Disclosure
            </h4>
            <p>
                MediaQ is supported by our readers. When you make a purchase through links on our site,
                we may earn an affiliate commission. This helps us continue providing quality content
                and improving your experience.
            </p>
        </div>
    );
} 