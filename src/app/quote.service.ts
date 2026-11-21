import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, map, timer } from 'rxjs';
import { calculateQuote, Quote, QuoteState, TripInput, tripKey, validateTrip } from './trip';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly stateSubject = new BehaviorSubject<QuoteState>({ status: 'idle' });
  private latestRequest: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get current(): QuoteState {
    return this.stateSubject.value;
  }

  request(trip: TripInput, now: Date = new Date()): void {
    // A new request cancels the old one, even if it was already waiting.
    this.latestRequest?.unsubscribe();
    this.latestRequest = null;

    const errors = validateTrip(trip, now);
    if (errors.length > 0) {
      this.stateSubject.next({ status: 'invalid', errors });
      return;
    }

    const key = tripKey(trip);
    this.stateSubject.next({ status: 'pending', tripKey: key });

    this.latestRequest = timer(300)
      .pipe(map(function () {
        return calculateQuote(trip);
      }))
      .subscribe(function (this: QuoteService, quote: Quote) {
        this.stateSubject.next({ status: 'success', tripKey: key, quote });
      }.bind(this));
  }

  reset(): void {
    this.latestRequest?.unsubscribe();
    this.latestRequest = null;
    this.stateSubject.next({ status: 'idle' });
  }
}
