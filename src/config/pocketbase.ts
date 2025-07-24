/**
 * PocketBase configuratie
 * Hier worden alle PocketBase-gerelateerde configuratie-instellingen beheerd
 */

// PocketBase server URL - gebruik environment variables voor verschillende omgevingen
const getPocketBaseUrl = (): string => {
  // Gebruik altijd de productie URL
  return 'https://pb.pitch-putt.live';
};

export const POCKETBASE_URL = getPocketBaseUrl();

// PocketBase instantie
import PocketBase from 'pocketbase';
export const pb = new PocketBase(POCKETBASE_URL);

// Exporteer de PocketBase instantie als default
export default pb;
