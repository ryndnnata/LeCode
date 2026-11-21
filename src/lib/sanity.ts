import { createClient, type SanityClient } from "@sanity/client";

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  useCdn: true,
};

export const isSanityConfigured = Boolean(sanityConfig.projectId);

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      ...sanityConfig,
      perspective: "published",
    })
  : null;


export const sanityWriteClient: SanityClient | null =
  isSanityConfigured && process.env.SANITY_API_WRITE_TOKEN
    ? createClient({
        ...sanityConfig,
        token: process.env.SANITY_API_WRITE_TOKEN,
        useCdn: false,
        perspective: "published",
      })
    : null;

export const canWriteToSanity = Boolean(sanityWriteClient);
