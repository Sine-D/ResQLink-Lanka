# TODO — Member 3: Rescue Team Dispatch Module

The basic scaffold for Member 3 is created (`Incident`, `RescueTeam`, `RescueAssignment` models, route `/district-officer/incidents`, and API `POST /api/incidents/[id]/dispatch`).

## Open Flows to Implement for Rubric Completion:
1. **Team Availability Race Condition:** Implement locking mechanism to prevent assigning the same rescue team to two simultaneous incidents.
2. **GPS En-Route Tracking:** Add real-time team location updates on Leaflet map.
3. **Status Lifecycle:** Handle assignment transitions: `ASSIGNED` -> `EN_ROUTE` -> `ON_SCENE` -> `COMPLETED`.
4. **Unit Tests:** Add Jest unit test suite for `rescueDispatchService.ts`.
