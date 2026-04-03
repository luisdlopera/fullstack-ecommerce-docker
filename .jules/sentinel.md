## 2025-05-18 - [CRITICAL] Prevent Bcrypt Timing and DoS Attacks

**Vulnerability:**
The `LoginUseCase` attempted to prevent timing attacks during failed user lookups by comparing the provided password against a dummy hash (`$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha`). However, this dummy hash was structurally invalid for `bcryptjs`. Consequently, `bcryptjs.compare` rejected it almost instantaneously (1ms), whereas comparing a valid hash takes significantly longer (e.g., 105ms). This timing discrepancy permitted user enumeration, allowing an attacker to deduce whether an email address existed in the system based on response times. Furthermore, password inputs across various endpoints (`login`, `register`, `reset-password`) lacked a maximum length constraint, exposing the system to Denial of Service (DoS) attacks via CPU exhaustion when processing excessively long passwords.

**Learning:**
Security mitigations can backfire if not thoroughly tested. The invalid dummy hash created the exact vulnerability it was designed to prevent. Additionally, because hashing algorithms like bcrypt are designed to be computationally expensive, failing to bound input lengths at the validation layer creates an asymmetric resource consumption vector for attackers.

**Prevention:**
1.  Always use a valid, pre-computed bcrypt hash (with the same cost factor as production hashes) for constant-time comparisons when simulating password verification for non-existent users.
2.  Always apply a strict `@MaxLength` validation rule (e.g., `@MaxLength(100)`) to password fields in Data Transfer Objects (DTOs) to neutralize DoS attempts before they reach the CPU-intensive hashing layer.
