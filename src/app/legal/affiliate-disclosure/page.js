import Link from 'next/link';

export const metadata = {
    title: 'Affiliate Disclosure | MediaQ',
    description: 'Information about how we use affiliate links on MediaQ'
}

export default function AffiliateDisclosurePage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">Affiliate Disclosure</h1>

            <div className="prose dark:prose-invert max-w-none">
                <p>
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                <h2>Disclosure Policy</h2>
                <p>
                    MediaQ ("we," "us," or "our") believes in transparency with our users. This
                    Affiliate Disclosure explains how we use affiliate links on our website and
                    applications.
                </p>

                <h2>What Are Affiliate Links?</h2>
                <p>
                    Some links on our site are "affiliate links." This means if you click on the link
                    and purchase the item, MediaQ will receive an affiliate commission at no extra cost
                    to you. The price you pay remains the same whether you use our affiliate link or go
                    directly to the vendor's website.
                </p>

                <h2>Our Affiliate Relationships</h2>
                <p>
                    MediaQ is a participant in the following affiliate programs:
                </p>
                <ul>
                    <li>Green Man Gaming Affiliate Program</li>
                    {/* Add other affiliate programs as needed */}
                </ul>

                <h2>How We Use Affiliate Links</h2>
                <p>
                    We use affiliate links primarily when:
                </p>
                <ul>
                    <li>Recommending games and other digital products</li>
                    <li>Providing links to purchase media items in our catalog</li>
                    <li>Suggesting resources related to items in your media queue</li>
                </ul>

                <h2>Our Editorial Principles</h2>
                <p>
                    We maintain editorial independence and integrity in the following ways:
                </p>
                <ul>
                    <li>We only recommend products we genuinely believe will benefit our users</li>
                    <li>Our editorial decisions are not influenced by affiliate relationships</li>
                    <li>We disclose affiliate relationships clearly throughout our website</li>
                </ul>

                <h2>Identification of Affiliate Links</h2>
                <p>
                    We make efforts to ensure affiliate links are identifiable by:
                </p>
                <ul>
                    <li>Including disclosure notices near affiliate content</li>
                    <li>Providing this comprehensive disclosure policy</li>
                </ul>

                <h2>Questions About This Policy</h2>
                <p>
                    If you have any questions about our use of affiliate links, please contact us at:
                    <br />
                    <Link href="/contact" className="text-primary hover:underline">Contact Us</Link>
                </p>
            </div>
        </div>
    );
} 