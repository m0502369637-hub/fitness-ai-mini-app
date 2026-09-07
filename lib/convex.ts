"use client";

import { ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * The Convex client, or `null` when NEXT_PUBLIC_CONVEX_URL is not configured.
 * When null, the app runs in demo mode with in-memory data.
 */
export const convex = url ? new ConvexReactClient(url) : null;

export const isConvexEnabled = convex !== null;
