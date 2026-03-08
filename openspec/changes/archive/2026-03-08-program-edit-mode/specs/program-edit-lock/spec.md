## ADDED Requirements

### Requirement: Program documents SHALL support an edit lock field
Each program document SHALL include an optional `editLock` field. When set, it SHALL contain `userId` (string), `userName` (string), `lockedAt` (Timestamp), and `expiresAt` (Timestamp). When the program is not being edited, `editLock` SHALL be null. Existing programs without an `editLock` field SHALL be treated as unlocked.

#### Scenario: Program document includes edit lock field
- **WHEN** a program document is read from Firestore
- **THEN** the `editLock` field SHALL be parsed as either an object with userId, userName, lockedAt, expiresAt or null
- **AND** a missing `editLock` field SHALL be treated as null (unlocked)

### Requirement: Edit lock SHALL be acquired via Firestore transaction
The `acquireEditLock(programId, userId, userName)` function SHALL use a Firestore `runTransaction()` to atomically read the current lock state and write a new lock. The transaction SHALL succeed only if the current lock is null or expired (expiresAt < now). On success, it SHALL write `editLock` with the requesting user's info, `lockedAt` as server timestamp, and `expiresAt` as lockedAt + 10 minutes. On failure (lock held by another user), it SHALL return the current lock holder's info.

#### Scenario: Admin acquires lock on unlocked program
- **WHEN** an admin calls acquireEditLock on a program with no active lock
- **THEN** the function SHALL set editLock with the admin's userId and userName
- **AND** expiresAt SHALL be set to 10 minutes from now
- **AND** the function SHALL return success

#### Scenario: Admin attempts to acquire lock held by another user
- **WHEN** an admin calls acquireEditLock on a program locked by another user whose lock has not expired
- **THEN** the function SHALL NOT modify the editLock field
- **AND** the function SHALL return failure with the current holder's userName and expiresAt

#### Scenario: Admin acquires lock that has expired
- **WHEN** an admin calls acquireEditLock on a program whose editLock.expiresAt is in the past
- **THEN** the function SHALL overwrite editLock with the requesting admin's info
- **AND** the function SHALL return success

### Requirement: Edit lock SHALL be released via Firestore transaction
The `releaseEditLock(programId, userId)` function SHALL use a Firestore `runTransaction()` to atomically verify the current lock holder matches the requesting user and set `editLock` to null. If the lock is held by a different user, the release SHALL be a no-op.

#### Scenario: Admin releases their own lock
- **WHEN** an admin calls releaseEditLock and they hold the current lock
- **THEN** the editLock field SHALL be set to null

#### Scenario: Admin attempts to release another user's lock
- **WHEN** an admin calls releaseEditLock but another user holds the lock
- **THEN** the editLock field SHALL NOT be modified

### Requirement: Edit lock SHALL support force-acquire for admins
The `forceAcquireEditLock(programId, userId, userName)` function SHALL use a Firestore `runTransaction()` to unconditionally write a new lock regardless of the current holder. It SHALL return the previous holder's info (if any) so the UI can notify the displaced editor.

#### Scenario: Admin force-acquires lock from another editor
- **WHEN** an admin calls forceAcquireEditLock on a program locked by another user
- **THEN** the editLock SHALL be overwritten with the requesting admin's info
- **AND** the function SHALL return the previous holder's userName

### Requirement: Edit lock SHALL expire after 10 minutes
The edit lock TTL SHALL be 10 minutes from acquisition. Expired locks SHALL be treated as unlocked by all clients. The lock holder MAY extend their lock by re-acquiring (which resets the 10-minute timer).

#### Scenario: Lock expires after 10 minutes
- **WHEN** 10 minutes have passed since a lock was acquired without extension
- **THEN** any subsequent acquireEditLock call SHALL treat the lock as expired and succeed
- **AND** the original lock holder's client SHALL detect the expiry and exit edit mode
