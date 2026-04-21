export interface PaymentGateway {
  type: 'upi_direct' | 'razorpay' | 'stripe';
  config: {
    upiId?: string;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    stripePublicKey?: string;
    connected?: boolean;
    enabled?: boolean;
  };
}

export interface SystemSettings {
  id: string;
  platformName: string;
  logoUrl: string;
  allowedAdmins: string[]; // List of emails
  commissionRate: number;
  maintenanceMode: boolean;
  availableTTSVoices: string[]; // List of voices like ['Aditi', 'Raveena', 'Matthew', 'Joey']
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  trialDays: number; // Duration of trial in days
  features: {
    maxWidgets: number;
    customThemes: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    ttsVoices: string[]; // List of enabled AI voices for this plan
    handlingFee: number; // Platform fee for this plan
  };
}

export interface Streamer {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  accentColor?: string;
  role: 'streamer' | 'admin';
  planId: string; // Reference to SubscriptionPlan
  isTrial: boolean;
  trialEndsAt?: any; // Firestore Timestamp
  obsToken: string; // Unique token for OBS plugin/browser sources
  subscriptionActive: boolean;
  subscriptionExpiry?: any; // Firestore Timestamp
  preferredCurrency: string; // e.g., 'INR', 'USD', 'EUR'
  createdAt: any;
  gateways: PaymentGateway[];
  secrets?: Record<string, string>;
}

export interface Donation {
  id: string;
  streamerId: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string;
  isTTSPlayed: boolean;
  gatewayUsed: string;
  status: 'pending' | 'verified';
  paymentId?: string; // Razorpay payment ID or UPI transaction ID
  createdAt: any; // Firestore Timestamp
}

export interface WidgetConfig {
  minAmount: number;
  ttsEnabled: boolean;
  ttsVoice?: string;
  primaryColor: string;
  animationType: string;
  goalAmount?: number;
  goalTitle?: string;
  currentProgress?: number;
  tickerSpeed?: 'slow' | 'normal' | 'fast';
  showText?: boolean;
}

export interface Widget {
  id: string;
  streamerId: string;
  type: 'alert' | 'goal' | 'ticker';
  config: WidgetConfig;
}
