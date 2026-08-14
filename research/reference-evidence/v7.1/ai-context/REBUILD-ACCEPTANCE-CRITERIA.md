# Rebuild acceptance criteria

- Every business record is tenant-scoped and cross-tenant access tests fail closed.
- Roles and permissions are enforced server-side for view, create, edit, delete, import, export and administration actions.
- Asset tags obey an explicit uniqueness policy with tested duplicate handling.
- Lifecycle changes are transactional, validated and preserved in an immutable audit history.
- Imports are previewed, validated, idempotent and recoverable; exports respect filters and permissions.
- Attachments are size/type checked, malware scanned and never publicly addressable by default.
- All observed required fields, limits, validation patterns and option sets are reconciled against the business-rules catalog.
- Responsive workflows support desktop and mobile barcode/QR use.
- Scheduled reports and alerts are retryable, observable and tenant-timezone aware.
- Critical flows have automated end-to-end tests and measurable performance/error budgets.
- Inferred and newly designed behaviors are recorded as architecture decisions rather than represented as observed facts.
