# Copilot Instructions for theaterSeats

## Project Overview
- This is an Ionic 3 + Angular project for a theater seat selection and ticketing system, using a customized [Seatchart](https://seatchart.js.org/) layout.
- The main feature is a V-shaped seat map with three plateas (A, B, C), dynamic pricing, and a shopping cart experience.
- The project integrates with a WordPress backend (PHP) for seat state persistence and uses REST API endpoints for seat status and updates.

## Key Files and Structure
- `src/pages/seats/seats.ts`: Core seat map logic, seat selection, cart, price calculation, and integration with the backend via `AsientosProvider`.
- `src/pages/seats/seats.html`/`.scss`: UI and custom styles for the seat map.
- `src/providers/asientos/asientos.ts`: Angular provider/service for all HTTP requests to the backend (REST endpoints for seat state).
- `resources/`: Cordova resources for icons and splash screens.
- `README.md`: Project setup, customization, and contribution guidelines.

## Data Flow and Integration
- Seat state (reserved, sold, available) is loaded from and updated to the WordPress backend using REST endpoints (see `asientosProvider`).
- Local session management uses a session ID stored in `sessionStorage` to distinguish users.
- Seat selection triggers updates both in the UI and via HTTP to the backend, ensuring cross-user consistency.
- Seat state is periodically refreshed from the backend to reflect real-time changes.

## Developer Workflows
- **Run locally:** `ionic serve` (requires Node.js 14+ and Ionic CLI 3).
- **Build Cordova resources:** `ionic cordova resources` (for icons/splash).
- **Backend endpoints:** Implemented in WordPress (PHP) under the `delportal/v1` namespace, e.g., `/estado` for seat state.
- **Customizing seat map:** Edit `seatLetters`, `layout`, and `seatTypes` in `seats.ts`.
- **Adding new seat logic:** Extend `AsientosProvider` and update `seats.ts` for new backend fields or logic.

## Project-Specific Patterns
- **Session-aware seat blocking:** Each seat block is associated with a session/user ID; only the owner can unblock or purchase.
- **Seat state enums:** Use 'Disponible', 'Reservado', 'Ocupado' for seat status, matching backend and frontend.
- **Plateas and pricing:** Platea assignment and price logic is centralized in `getPlateaDeAsiento` and `getSeatPrice`.
- **UI state sync:** After any seat state change, always call `refreshMap()` to update the UI.

## Integration Points
- **WordPress REST API:** All seat state changes and queries go through custom endpoints (see backend PHP code for `register_rest_route`).
- **Seatchart:** Used for rendering and managing the seat map; custom logic adapts it for theater layouts.
- **QR code generation:** Uses `qrcode` library for ticketing.

## Examples
- To add a new seat type or price, update `options.map.seatTypes` in `seats.ts`.
- To add a new backend field, update both the provider (`asientos.ts`) and the backend endpoint, then handle the new field in `seats.ts`.

---

For any unclear workflow or integration, check `README.md` and `src/pages/seats/seats.ts` for concrete usage patterns. If backend changes are needed, coordinate updates in both the provider and the WordPress PHP endpoints.
