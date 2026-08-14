# Coverage and remaining gaps after V7 synthesis

| Dimension | Evidence score | Basis |
| --- | ---: | --- |
| UI/navigation reconstruction | 9/10 | 149 normalized application routes and 285 screen states |
| Core asset workflows | 8/10 | 158 consolidated rules plus lifecycle routes/states |
| Form/data-field discovery | 9/10 | 258 distinct form structures across 16 classified entities |
| Admin/event configuration | 8/10 | Observed configuration routes and form metadata |
| Visual-design reconstruction | 8/10 | Previously captured screenshots plus UI state metadata |
| Logical data-model inference | 8/10 | 16 classified logical entities and 96 inferred relationships |
| Network/endpoint discovery | 8/10 | 167 normalized application request contracts |
| Business-rule reconstruction | 7/10 | 158 observed/inferred constraints and experiment results |
| Authorization/security reconstruction | 6/10 | Logged-out and secondary-role evidence available |
| Production-equivalent rebuild readiness | 7/10 | Strong behavioral blueprint; private internals and full RBAC remain unknown |

## Important remaining unknowns

- Exact physical database tables, indexes, stored procedures and production data constraints.
- Private server source code, internal service boundaries, hosting topology and deployment pipeline.
- Complete multi-role authorization matrix because the Manager comparison could not be completed.
- Exhaustive transactional rules for every mutation, concurrency case and failure path.
- Production scaling limits, job scheduling, email/SMS providers, backup/restore behavior and operational SLOs.

These cannot be established as facts from the collected browser evidence. The rebuild should resolve them as explicit product and architecture decisions, then validate them with tests.
