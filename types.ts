export enum Role {
  VOLUNTEER = 'VOLUNTEER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  points: number;
  level?: string; // e.g., 'Green Novice'
  rank?: number;
}

export enum HealthStatus {
  HEALTHY = 'Healthy',
  NEEDS_WATER = 'Needs Water',
  DAMAGED = 'Damaged',
  LOST = 'Lost', // Replaces 'Dead'
}

export interface WeatherData {
    temp: number; // in Celsius
    humidity: number; // in %
    rainfall: number; // in mm (last 24h)
}

export interface SaplingUpdate {
  id: string;
  date: string;
  status: HealthStatus;
  imageUrl: string;
  submittedBy: string; // User ID
  recommendation?: string; // AI Fusion Recommendation
  confidence?: number;
  weather?: WeatherData;
  soilCondition?: string; // e.g., 'Dry', 'Moist'
}

export interface Sapling {
  id: string;
  species: string;
  location: {
    lat: number;
    lng: number;
  };
  guardianId: string; // User ID
  plantationDate: string;
  updates: SaplingUpdate[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            text: string;
        }[]
    }[]
  };
}

export interface GroundingMetadata {
    groundingChunks: GroundingChunk[];
}

// --- Social Feed Types ---

export interface Like {
  userId: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  saplingId?: string; // Optional link to a specific sapling
  caption: string;
  imageUrl: string;
  timestamp: string;
  likes: Like[];
  comments: Comment[];
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    points: number;
    endDate: string;
}