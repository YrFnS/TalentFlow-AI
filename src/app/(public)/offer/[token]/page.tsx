import type { Metadata } from 'next';
import OfferSignContent from './content';

export const metadata: Metadata = {
  title: 'Secure Offer | TalentFlow AI',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function OfferSignPage() {
  return <OfferSignContent />;
}
