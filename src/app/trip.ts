import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms';

export type LocationId = 'A' | 'B' | 'C' | 'D' | 'E';
export type TruckCategoryId = 'mini' | 'medium' | 'large';

export interface LocationInfo {
  id: LocationId;
  name: string;
}

export interface TruckCategory {
  id: TruckCategoryId;
  label: string;
  capacityTonnes: number;
  ratePerKm: number;
  minimumFare: number;
}

export interface TripInput {
  pickup: LocationId | null;
  dropoffs: (LocationId | null)[];
  truck: TruckCategoryId | null;
  truckCount: number | null;
  weight: number | null;
  pickupTime: string;
  loading: boolean;
  unloading: boolean;
}

export interface Quote {
  distanceKm: number;
  farePerTruck: number;
  transportCost: number;
  serviceCost: number;
  totalQuote: number;
}

export type QuoteState =
  | { status: 'idle' }
  | { status: 'pending'; tripKey: string }
  | { status: 'success'; tripKey: string; quote: Quote }
  | { status: 'invalid'; errors: string[] };

export const MAX_DROPOFFS = 3;
export const MAX_TRUCKS = 5;
export const LOADING_FEE_PER_TRUCK = 600;
export const UNLOADING_FEE_PER_TRUCK = 400;

export const LOCATIONS: LocationInfo[] = [
  { id: 'A', name: 'Baily Road' },
  { id: 'B', name: 'Shahbagh' },
  { id: 'C', name: 'Bijoy Sarani' },
  { id: 'D', name: 'Banani' },
  { id: 'E', name: 'Uttara' },
];

export const TRUCKS: TruckCategory[] = [
  { id: 'mini', label: 'Mini', capacityTonnes: 1.5, ratePerKm: 50, minimumFare: 1200 },
  { id: 'medium', label: 'Medium', capacityTonnes: 3, ratePerKm: 85, minimumFare: 2000 },
  { id: 'large', label: 'Large', capacityTonnes: 7, ratePerKm: 145, minimumFare: 3500 },
];

const DISTANCES: Record<string, number> = {
  'A-B': 12, 'A-C': 18, 'A-D': 26, 'A-E': 30,
  'B-C': 15, 'B-D': 29, 'B-E': 24,
  'C-D': 22, 'C-E': 28,
  'D-E': 17,
};

export function distanceBetween(a: LocationId, b: LocationId): number {
  if (a === b) return 0;
  return DISTANCES[[a, b].sort().join('-')];
}

export function findTruck(truckId: TruckCategoryId | null): TruckCategory | undefined {
  for (const truck of TRUCKS) {
    if (truck.id === truckId) return truck;
  }
  return undefined;
}

export function emptyTrip(): TripInput {
  return {
    pickup: null,
    dropoffs: [null],
    truck: null,
    truckCount: 1,
    weight: null,
    pickupTime: '',
    loading: false,
    unloading: false,
  };
}

export function tripKey(trip: TripInput): string {
  return JSON.stringify([
    trip.pickup, trip.dropoffs, trip.truck, trip.truckCount,
    trip.weight, trip.pickupTime, trip.loading, trip.unloading,
  ]);
}

export function validateTrip(trip: TripInput, now: Date): string[] {
  const errors: string[] = [];

  // Check each required field and add a useful error message when it is wrong.
  if (!trip.pickup) errors.push('Select a pickup location.');
  if (trip.dropoffs.length < 1 || trip.dropoffs.length > MAX_DROPOFFS) {
    errors.push(`Add between 1 and ${MAX_DROPOFFS} drop-off locations.`);
  }
  let missingDropoff = false;
  for (const dropoff of trip.dropoffs) {
    if (dropoff === null) missingDropoff = true;
  }
  if (missingDropoff) errors.push('Choose a location for every drop-off.');

  const chosen: LocationId[] = [];
  if (trip.pickup !== null) chosen.push(trip.pickup);
  for (const dropoff of trip.dropoffs) {
    if (dropoff !== null) chosen.push(dropoff);
  }
  if (new Set(chosen).size < chosen.length) {
    errors.push('The same location cannot appear twice in one trip.');
  }

  const truck = findTruck(trip.truck);
  if (!truck) errors.push('Select a truck category.');

  const count = trip.truckCount;
  const countOk = count !== null && Number.isInteger(count) && count >= 1 && count <= MAX_TRUCKS;
  if (!countOk) errors.push(`Number of trucks must be a whole number from 1 to ${MAX_TRUCKS}.`);

  const weight = trip.weight;
  if (weight === null || !Number.isFinite(weight) || weight <= 0) {
    errors.push('Enter a cargo weight greater than 0 tonnes.');
  } else if (truck && countOk && count !== null && weight > truck.capacityTonnes * count) {
    errors.push(
      `Cargo (${weight} t) is more than ${count} ${truck.label} truck(s) can carry ` +
      `(${truck.capacityTonnes * count} t). Reduce the weight or choose more or larger trucks.`
    );
  }

  if (!trip.pickupTime) {
    errors.push('Choose a pickup date and time.');
  } else {
    const time = new Date(trip.pickupTime).getTime();
    if (Number.isNaN(time)) errors.push('The pickup date and time is not valid.');
    else if (time <= now.getTime()) errors.push('Pickup must be later than the current date and time.');
  }

  return errors;
}

export function routeDistanceKm(route: LocationId[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += distanceBetween(route[i - 1], route[i]);
  return total;
}

export function calculateQuote(trip: TripInput): Quote {
  // Find the selected truck and calculate the route and all price parts.
  const truck = findTruck(trip.truck);
  const count = trip.truckCount;
  if (!trip.pickup || !truck || !count) {
    throw new Error('Cannot calculate a quote for an incomplete trip.');
  }

  const route: LocationId[] = [trip.pickup];
  for (const dropoff of trip.dropoffs) {
    if (dropoff !== null) route.push(dropoff);
  }
  const distanceKm = routeDistanceKm(route);
  const farePerTruck = Math.max(distanceKm * truck.ratePerKm, truck.minimumFare);
  const transportCost = farePerTruck * count;
  const serviceCost =
    ((trip.loading ? LOADING_FEE_PER_TRUCK : 0) + (trip.unloading ? UNLOADING_FEE_PER_TRUCK : 0)) * count;

  return { distanceKm, farePerTruck, transportCost, serviceCost, totalQuote: transportCost + serviceCost };
}

export type TripForm = FormGroup<{
  pickup: FormControl<LocationId | null>;
  dropoffs: FormArray<FormControl<LocationId | null>>;
  truck: FormControl<TruckCategoryId | null>;
  truckCount: FormControl<number | null>;
  weight: FormControl<number | null>;
  pickupTime: FormControl<string>;
  loading: FormControl<boolean>;
  unloading: FormControl<boolean>;
}>;

function tripValidator(group: AbstractControl): ValidationErrors | null {
  const errors = validateTrip(readTrip(group as TripForm), new Date());
  return errors.length > 0 ? { trip: errors } : null;
}

export function createTripForm(): TripForm {
  return new FormGroup(
    {
      pickup: new FormControl<LocationId | null>(null),
      dropoffs: new FormArray([new FormControl<LocationId | null>(null)]),
      truck: new FormControl<TruckCategoryId | null>(null),
      truckCount: new FormControl<number | null>(1),
      weight: new FormControl<number | null>(null),
      pickupTime: new FormControl('', { nonNullable: true }),
      loading: new FormControl(false, { nonNullable: true }),
      unloading: new FormControl(false, { nonNullable: true }),
    },
    { validators: tripValidator }
  );
}

export function readTrip(form: TripForm): TripInput {
  const value = form.getRawValue();
  return { ...value, dropoffs: value.dropoffs };
}

export function writeTrip(form: TripForm, trip: TripInput): void {
  const dropoffs = form.controls.dropoffs;
  dropoffs.clear();
  const savedDropoffs = trip.dropoffs.length > 0 ? trip.dropoffs : [null];
  for (const dropoff of savedDropoffs) {
    dropoffs.push(new FormControl<LocationId | null>(dropoff));
  }
  form.patchValue({
    pickup: trip.pickup,
    truck: trip.truck,
    truckCount: trip.truckCount,
    weight: trip.weight,
    pickupTime: trip.pickupTime,
    loading: trip.loading,
    unloading: trip.unloading,
  });
}
