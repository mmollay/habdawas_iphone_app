// ============================================================================
// COMMUNITY CREDIT SYSTEM - TypeScript Types
// ============================================================================

export interface SystemSettings {
  dailyFreeListings: number;
  costPerListing: number;
  communityPotBalance: number;
  powerUserCreditPrice: number;
  minDonationAmount: number;
  powerUserMinPurchase: number;
  lowPotWarningThreshold: number;
  donationInseratePrice?: number;
  aiModel?: string;
  avgTokensPerListing?: number;
  tokenCostPerMillion?: number;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export type DonationType = 'community_pot' | 'personal_credits';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Donation {
  id: string;
  user_id: string;
  amount: number;
  donation_type: DonationType;
  credits_granted: number;
  stripe_payment_id: string | null;
  stripe_session_id: string | null;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
}

// Donation with populated user data
export interface DonationWithUser extends Donation {
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export type CommunityPotTransactionType = 'donation' | 'usage' | 'adjustment';

export interface CommunityPotTransaction {
  id: string;
  transaction_type: CommunityPotTransactionType;
  user_id: string | null;
  amount: number; // Positive = Einzahlung, Negative = Nutzung
  balance_after: number;
  description: string | null;
  item_id: string | null;
  donation_id: string | null;
  created_at: string;
}

// CommunityPotTransaction with populated user and item data
export interface CommunityPotTransactionWithRelations extends CommunityPotTransaction {
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  items?: {
    id: string;
    title: string;
  } | null;
}

// Erweiterte Profile mit Credit-Feldern
export interface ProfileWithCredits {
  id: string;
  email: string;
  full_name: string | null;
  personal_credits: number;
  total_donated: number;
  community_listings_donated: number;
  daily_listings_used: number;
  last_listing_date: string;
}

// Community Stats für Dashboard
export interface CommunityStats {
  totalBalance: number;
  totalDonations: number;
  totalDonationAmount: number;
  activeDonors: number;
  totalListingsFinanced: number;
  userDonationAmount: number;
  userListingsDonated: number;
}

// Credit Check Result
export interface CreditCheckResult {
  canCreate: boolean;
  source: 'community_pot' | 'personal_credits' | null;
  reason?: string;
  message?: string;
  remainingDailyListings?: number;
  personalCredits?: number;
  communityPotBalance?: number;
}

// Donation Create DTO
export interface CreateDonationDTO {
  amount: number;
  donationType: DonationType;
  stripePaymentId?: string;
  stripeSessionId?: string;
}

// Admin Settings Update DTO
export interface UpdateSystemSettingDTO {
  setting_key: string;
  setting_value: any;
  description?: string;
}
