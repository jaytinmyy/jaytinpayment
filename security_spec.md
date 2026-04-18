# Security Specification for JayTIN Ledger

## 1. Data Invariants
- A ledger record MUST have a valid `ownerId` matching the creator's UID.
- `paidAmount` cannot exceed `totalAmount` in normal circumstances (though the app might allow it, we should enforce reasonable bounds).
- `updatedAt` MUST match `request.time` on all writes.
- `id` in document MUST match document ID.
- `shareKey` is the only way for non-owners to read a record (via specific lookup).

## 2. The "Dirty Dozen" Payloads (Targets for Rejection)

1. **Identity Spoofing**: Creating a record with an `ownerId` that is not the current user's UID.
2. **Privilege Escalation**: Attempting to update `ownerId` of an existing record.
3. **Ghost Field Injection**: Adding an unmapped field like `isVerified: true` to bypass logic.
4. **ID Poisoning**: Using a 2KB string as a document ID.
5. **Timestamp Fraud**: Providing a client-side date for `updatedAt` instead of `serverTimestamp()`.
6. **Resource Exhaustion**: Sending an `items` array with 10,000 elements.
7. **Negative Valuation**: Setting `totalAmount` to -100.
8. **Invalid Status**: Setting status to `Admin` or some other non-enum value.
9. **Short-Key Sharing**: Setting `shareKey` to a short, easily guessable string (e.g., "123").
10. **Orphaned Writes**: Creating a ledger doc with an ID that doesn't match its internal `id` field.
11. **Shadow Update**: Updating `paidAmount` while sneaking in a change to `totalAmount` in a "Join" action (if defined).
12. **Unauthorized Metadata**: Trying to delete a record owned by someone else.

## 3. Test Runner (Conceptual/Reference)
See `firestore.rules.test.ts` for implementation of these checks. (To be implemented if environment allows).
