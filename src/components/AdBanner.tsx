import { useEffect, useRef } from 'react';

interface AdBannerProps {
    adSlot: string;
    adFormat?: string;
    fullWidthResponsive?: boolean;
    style?: React.CSSProperties;
}

export default function AdBanner ({
    adSlot,
    adFormat = 'auto',
    fullWidthResponsive = true,
    style = { display: 'block' },
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <ins
            ref={adRef}
            className="adsbygoogle"
            style={style}
            data-ad-client="ca-pub-6461845207268295"
            data-ad-slot={adSlot}
            data-ad-format={adFormat}
            data-full-width-responsive={fullWidthResponsive.toString()}
        />
    );
}