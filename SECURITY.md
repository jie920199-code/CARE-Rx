# CARE-Rx Security Policy

## Supported status

CARE-Rx is currently a planning and safety-prototype project. It is not approved for clinical deployment and does not contain approved clinical prescriptions.

## Reporting a vulnerability

Do not open a normal GitHub Issue containing vulnerability details, credentials, patient information or screenshots with sensitive data. Use the repository's private security advisory channel:

`https://github.com/jie920199-code/CARE-Rx/security/advisories/new`

Include only synthetic reproduction data. Never attach real patient records, images, exports, databases or logs.

## High-priority security areas

- Bypass of red flags, contraindications, pause or referral gates.
- Execution or export of unapproved clinical rules or prescriptions.
- Patient input reaching databases, logs, telemetry, backups or crash reports.
- Session ownership, timeout or clearing failures.
- Authentication, authorization, CSRF, session fixation or network exposure issues.
- Rule-engine support for arbitrary code, unknown operators or unsafe actions.

## Response expectations

Security reports should be acknowledged privately before any public discussion. Clinical safety concerns remain blocked until reviewed by a qualified therapist and covered by regression tests.
