import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DraftService } from './draft.service';
import { QuoteService } from './quote.service';
import {
  createTripForm,
  emptyTrip,
  LOCATIONS,
  LOADING_FEE_PER_TRUCK,
  MAX_DROPOFFS,
  MAX_TRUCKS,
  readTrip,
  TRUCKS,
  tripKey,
  UNLOADING_FEE_PER_TRUCK,
  writeTrip,
  LocationId,
} from './trip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly quotes = inject(QuoteService);
  private readonly drafts = inject(DraftService);
  private readonly destroyRef = inject(DestroyRef);

  readonly locations = LOCATIONS;
  readonly trucks = TRUCKS;
  readonly maxDropoffs = MAX_DROPOFFS;
  readonly maxTrucks = MAX_TRUCKS;
  readonly loadingFee = LOADING_FEE_PER_TRUCK;
  readonly unloadingFee = UNLOADING_FEE_PER_TRUCK;

  readonly form = createTripForm();
  readonly quoteState = toSignal(this.quotes.state$, { requireSync: true });

  readonly currentKey = signal('');
  readonly problems = signal<string[]>([]);
  readonly draftMessage = signal('');

  private dragIndex: number | null = null;

  constructor() {
    // Restore a saved draft when the page first opens.
    const result = this.drafts.load();
    if (result.status === 'restored') {
      writeTrip(this.form, result.trip);
      this.draftMessage.set('Saved draft restored. Press "Get quote" to calculate a quote for it.');
    } else if (result.status === 'damaged') {
      this.draftMessage.set('The saved draft was damaged and could not be restored.');
    }

    this.sync();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.onFormValueChanged.bind(this));
  }

  get dropoffs() {
    return this.form.controls.dropoffs;
  }

  private sync(): void {
    // Update the form key and validation messages whenever the form changes.
    this.currentKey.set(tripKey(readTrip(this.form)));
    this.problems.set(this.form.errors?.['trip'] ?? []);
  }

  addDropoff(): void {
    if (this.dropoffs.length < MAX_DROPOFFS) this.dropoffs.push(new FormControl<LocationId | null>(null));
  }

  removeDropoff(index: number): void {
    if (this.dropoffs.length > 1) this.dropoffs.removeAt(index);
  }

  onDragStart(event: DragEvent, index: number): void {
    // Remember which drop-off is being moved.
    this.dragIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
      const row = (event.target as HTMLElement).closest('.row');
      if (row) event.dataTransfer.setDragImage(row, 0, 0);
    }
  }

  onDrop(event: DragEvent, to: number): void {
    // Move the dropped stop to the new position in the form.
    event.preventDefault();
    const from = this.dragIndex;
    this.dragIndex = null;
    if (from === null || from === to) return;
    const moved = this.dropoffs.at(from);
    this.dropoffs.removeAt(from);
    this.dropoffs.insert(from < to ? to - 1 : to, moved);
  }

  onDragEnd(): void {
    this.dragIndex = null;
  }

  requestQuote(): void {
    // Check the time again because it may have expired while the page was open.
    this.form.updateValueAndValidity();
    this.quotes.request(readTrip(this.form));
  }

  private onFormValueChanged(): void {
    this.draftMessage.set('');
    this.sync();
  }

  saveDraft(): void {
    const ok = this.drafts.save(readTrip(this.form));
    this.draftMessage.set(
      ok ? `Draft saved at ${new Date().toLocaleTimeString()}.` : 'Could not save the draft: browser storage is unavailable.'
    );
  }

  clearDraft(): void {
    this.drafts.clear();
    this.quotes.reset();
    writeTrip(this.form, emptyTrip());
    this.draftMessage.set('Draft cleared. You can start again.');
  }
}
