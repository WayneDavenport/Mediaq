'use client';

import { Info } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
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
                    <TooltipTrigger className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                        Disclosure
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
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="disclosure" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                    <span className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Affiliate Disclosure
                    </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 mt-2">
                    <p>
                        MediaQ is supported by our readers. When you make a purchase through links on our site,
                        we may earn an affiliate commission. This helps us continue providing quality content
                        and improving your experience.
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
} 