import type { Badge, NgoProfile } from './api';
import BadgeChip from './BadgeChip';
import TrustScore from './TrustScore';
import VerificationBadge from './VerificationBadge';

interface NgoCardProps {
  ngo: NgoProfile;
}

function badgeForMeals(meals: number): Badge {
  if (meals >= 1000) return { tier: 'hunger-warrior', label: 'Hunger Warrior', emoji: '🥇', threshold: 1000 };
  if (meals >= 500) return { tier: 'community-hero', label: 'Community Hero', emoji: '🥈', threshold: 500 };
  if (meals >= 100) return { tier: 'food-saver', label: 'Food Saver', emoji: '🥉', threshold: 100 };
  return { tier: 'none', label: 'No badge yet', emoji: '', threshold: 0 };
}

export default function NgoCard({ ngo }: NgoCardProps) {
  return (
    <article className="ngo-card glass-card">
      <h3>{ngo.name}</h3>
      <VerificationBadge verified={ngo.verified} />
      <TrustScore score={ngo.trustScore} />
      <BadgeChip badge={badgeForMeals(ngo.totalMealsDistributed)} />
      <dl className="ngo-metrics">
        <div>
          <dt>Donations received</dt>
          <dd>{ngo.totalDonationsReceived}</dd>
        </div>
        <div>
          <dt>Meals distributed</dt>
          <dd>{ngo.totalMealsDistributed.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Successful deliveries</dt>
          <dd>{ngo.successfulDeliveries}</dd>
        </div>
        <div>
          <dt>Timely pickups</dt>
          <dd>{ngo.timelyPickups}</dd>
        </div>
        <div>
          <dt>Proof uploads</dt>
          <dd>{ngo.proofUploads}</dd>
        </div>
      </dl>
    </article>
  );
}
