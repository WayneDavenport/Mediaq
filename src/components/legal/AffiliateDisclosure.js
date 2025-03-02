import Link from 'next/link';
import { Info } from 'lucide-react';

export default function AffiliateDisclosure({ minimal = false }) {
    if (minimal) {
        return (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Contains affiliate links. <Link href="/legal/affiliate-disclosure" className="underline hover:text-primary">Learn more</Link></span>
            </p>
        );
    }

    return (
        <div className="text-sm bg-muted/30 p-3 rounded-md border my-4">
            <h4 className="font-medium flex items-center gap-1 mb-1">
                <Info className="h-4 w-4" />
                Affiliate Disclosure
            </h4>
            <p>
                MediaQ is a participant in affiliate programs including the Green Man Gaming Affiliate Program.
                We earn commissions for purchases made through links on our site.
                This doesn't affect our editorial independence or increase prices for you.
                <Link href="/legal/affiliate-disclosure" className="ml-1 underline hover:text-primary">
                    View our full disclosure
                </Link>
            </p>
        </div>
    );
} 