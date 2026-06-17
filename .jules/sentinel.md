## 2025-04-05 - [Timing Attack] Malformed bcrypt dummy hash enables user enumeration

**Vulnerability:** A timing attack vulnerability was found in the login endpoint. To prevent user enumeration, the code attempted to execute `bcryptjs.compare` against a dummy hash when a user was not found. However, it used a malformed dummy string (`$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha`) which caused `bcryptjs.compare` to fail instantly without doing the expensive computation, defeating the purpose of the mitigation and enabling an attacker to measure response times to see if an email existed. It also used an incorrect cost factor (`12` vs real hashes which were `10`), so even if it were correctly formatted, it would still take a drastically different amount of time.

**Learning:** `bcryptjs.compare` will instantly return false for improperly formatted hashes. Furthermore, the dummy hash must have the same algorithm and cost factor as genuine password hashes to normalize the execution time correctly.

**Prevention:** Always use a valid, pre-computed bcrypt hash with the exact same cost factor as your real passwords when implementing dummy timing attack mitigations.
