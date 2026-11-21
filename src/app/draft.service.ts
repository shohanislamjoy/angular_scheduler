import { Injectable } from '@angular/core';
import { LOCATIONS, MAX_DROPOFFS, MAX_TRUCKS, TRUCKS, emptyTrip, LocationId, TripInput, TruckCategoryId } from './trip';

export const DRAFT_KEY = 'trip-quote-draft';

export type DraftLoadResult =
  | { status: 'none' }
  | { status: 'damaged' }
  | { status: 'restored'; trip: TripInput };

// Check that a saved value is a normal object, not an array or null.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Only location IDs that appear in the app should be restored.
function isLocationId(value: unknown): value is LocationId {
  for (const location of LOCATIONS) {
    if (location.id === value) return true;
  }
  return false;
}

// Only truck IDs that appear in the app should be restored.
function isTruckId(value: unknown): value is TruckCategoryId {
  for (const truck of TRUCKS) {
    if (truck.id === value) return true;
  }
  return false;
}

// Build a safe trip object from data saved in the browser.
export function sanitizeTrip(raw: unknown): TripInput {
  const r = isRecord(raw) ? raw : {};
  const trip = emptyTrip();

  trip.pickup = isLocationId(r['pickup']) ? r['pickup'] : null;

  // Keep the saved stop order, but remove bad or repeated locations.
  const used = new Set<LocationId>();
  if (trip.pickup) used.add(trip.pickup);
  const dropoffs: (LocationId | null)[] = [];
  if (Array.isArray(r['dropoffs'])) {
    for (const item of r['dropoffs'].slice(0, MAX_DROPOFFS)) {
      if (isLocationId(item) && !used.has(item)) {
        used.add(item);
        dropoffs.push(item);
      } else {
        dropoffs.push(null);
      }
    }
  }
  trip.dropoffs = dropoffs.length > 0 ? dropoffs : [null];

  trip.truck = isTruckId(r['truck']) ? r['truck'] : null;

  const count = r['truckCount'];
  trip.truckCount =
    typeof count === 'number' && Number.isInteger(count) && count >= 1 && count <= MAX_TRUCKS ? count : 1;

  const weight = r['weight'];
  trip.weight = typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? weight : null;

  const time = r['pickupTime'];
  const looksLikeDateTime = typeof time === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time);
  trip.pickupTime = looksLikeDateTime && !Number.isNaN(new Date(time).getTime()) ? time : '';

  trip.loading = r['loading'] === true;
  trip.unloading = r['unloading'] === true;
  return trip;
}

@Injectable({ providedIn: 'root' })
export class DraftService {
  // Save the current trip in browser storage.
  save(trip: TripInput): boolean {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(trip));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
    }
  }

  load(): DraftLoadResult {
    let text: string | null;
    try {
      text = localStorage.getItem(DRAFT_KEY);
    } catch {
      return { status: 'none' };
    }
    if (text === null) return { status: 'none' };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.clear();
      return { status: 'damaged' };
    }
    if (!isRecord(parsed)) {
      this.clear();
      return { status: 'damaged' };
    }
    return { status: 'restored', trip: sanitizeTrip(parsed) };
  }
}
