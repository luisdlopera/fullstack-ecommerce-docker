## 2026-04-04 - [Fix dummy hash format for timing attacks]
**Vulnerability:** Timing attack due to invalid dummy bcrypt hash allowing user enumeration.
**Learning:** Invalid bcrypt hashes fail-fast in `bcryptjs`, meaning they do not consume the same CPU cycles as a real hash comparison. Always use a valid pre-computed hash for dummy comparisons.
**Prevention:** Pre-compute a valid bcrypt hash and use it for timing mitigations.
