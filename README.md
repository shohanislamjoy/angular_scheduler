# RouteQuote

RouteQuote is an Angular application for planning a multi-stop truck trip.
Users can choose a pickup location, reorder and add drop-offs, select a truck,
enter cargo details, calculate a quote, and save a draft in the browser.

## Features

- Reactive trip form with validation
- Up to three drop-off locations
- Native drag-and-drop stop reordering
- Route distance and truck quote calculation
- Loading, success, invalid, and idle quote states
- Draft saving, restoring, and clearing with `localStorage`
- Responsive layout for desktop and mobile screens

## Requirements

- Node.js
- npm

This project uses Angular 22.3.0 packages.

## Setup

Open a terminal in the project folder and run:

```bash
npm ci
```

## Run locally

Start the Angular development server:

```bash
npm start
```

Open http://localhost:4200/.

The development server reloads the app after source files change.

## Build

Create a production build:

```bash
npm run build
```

The build output is written to `dist/angular_scheduler`.

## Tests

Run the Angular test command:

```bash
npm test
```

The project currently has no `.spec.ts` or `.test.ts` files, so this command
will report that no tests were found.

## Manual testing

1. Select a pickup and drop-off location.
2. Select a truck category and enter a valid cargo weight.
3. Choose a future pickup date and time.
4. Add optional loading or unloading services if needed.
5. Select **Get quote** and confirm the loading state appears.
6. Confirm the quote matches the selected route and truck.
7. Change the form while a quote is loading and confirm the old quote is not
   shown as valid for the new trip.
8. Save a draft, reload the page, and confirm the saved trip is restored.
9. Clear the draft and confirm the form and quote reset.

## Project structure

- `src/app/app.component.ts` - page component and form behavior
- `src/app/app.component.html` - page layout and form controls
- `src/app/trip.ts` - trip types, validation, distance, and quote calculations
- `src/app/quote.service.ts` - quote state and asynchronous request handling
- `src/app/draft.service.ts` - browser draft save and restore logic
- `src/styles.css` - application styles

For technical decisions and the assignment answer details, see
[PROJECT_OVERVIEW.txt](./PROJECT_OVERVIEW.txt).
