# TODO — Member 4: Relief Resource Distribution Module

The basic scaffold for Member 4 is created (`ReliefResource`, `Distribution` models, route `/dmc/relief-resources`, and API `POST /api/relief-resources`).

## Open Flows to Implement for Rubric Completion:
1. **Low-Stock Alerting:** Trigger warning when stock drops below `minimumThreshold`.
2. **Recharts Inventory Analytics:** Add Recharts visual bar chart for stock levels across categories (Food, Water, Medical, Shelter).
3. **Offline Sync Queue:** Support offline distribution logging when connected to remote shelter centers.
4. **Unit Tests:** Add Jest unit test suite for `reliefResourceService.ts`.
