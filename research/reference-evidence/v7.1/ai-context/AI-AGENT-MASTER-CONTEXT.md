# AI-agent master context: Asset Management SaaS rebuild

## Mission

Build a production-ready, multi-tenant asset-management SaaS using the observed behavior in this evidence pack as functional reference. Do not assume that inferred details are facts. Preserve evidence traceability and turn unknowns into explicit design decisions.

## Evidence precedence

1. **OBSERVED** — directly captured route, form, table, header, validation, experiment or network metadata.
2. **INFERRED** — a logical relationship or architecture conclusion supported by observed evidence.
3. **RECOMMENDED** — a proposed design for the new product, not a claim about the reference application.
4. **UNKNOWN** — private or untested behavior that must not be invented silently.

## Scope discovered

- 149 normalized application routes
- 285 screen-state observations
- 258 form observations
- 87 table observations
- 167 application endpoint contracts
- 158 consolidated business rules/constraints
- Logical entities: Account (5 observed fields), Alert (7 observed fields), Asset (31 observed fields), Category (4 observed fields), Company (15 observed fields), Contract (5 observed fields), Department (4 observed fields), Document (1 observed fields), Event (133 observed fields), Group (1 observed fields), Inventory (2 observed fields), Location (6 observed fields), Person (11 observed fields), Report (150 observed fields), Site (11 observed fields), User (10 observed fields)

## Product capabilities

- Asset registry, identifiers, status and rich custom fields
- Assignment/custody plus check-out, check-in, lease, return, reserve, maintenance and disposal events
- People/users, sites, locations, categories, departments and groups
- Inventory/audit workflows, reports, dashboards, alerts and exports
- Contracts, documents/images and configurable forms/tables/events
- Company/account administration and role/permission management

## Mandatory architecture principles for the new version

- Tenant ID and authorization checks at every service/repository boundary.
- Immutable audit events for sensitive and lifecycle changes.
- Relational constraints, unique indexes and optimistic concurrency for critical records.
- Background jobs for large imports/exports, scheduled reports and notifications.
- Object storage with malware scanning and signed access for attachments.
- API contracts validated with schemas; idempotency for retried commands.
- Accessible, responsive UI with mobile barcode/QR scanning support.
- Automated unit, integration, end-to-end, tenant-isolation and RBAC tests.

## Files agents must consult

- `product/SCREEN-ROUTE-CATALOG.json` for pages, controls, forms and tables.
- `data-model/LOGICAL-DATA-MODEL.json` for entities, fields and inferred relationships.
- `contracts/ENDPOINT-CATALOG.json` for observed request metadata and schema shapes.
- `business-rules/BUSINESS-RULES-CATALOG.json` for traceable constraints.
- `security/SECURITY-AUTHORIZATION-MODEL.md` for known and missing controls.
- `architecture/TECHNICAL-ARCHITECTURE.md` for observed versus recommended architecture.
- `02-COVERAGE-AND-GAPS.md` for facts that remain unknown.

## Non-negotiable agent instruction

Never claim production equivalence merely because the UI looks similar. Link each implemented behavior to an evidence ID/file or mark it as a new product decision. Require human approval for ambiguous billing, deletion, retention, compliance and permission behavior.
