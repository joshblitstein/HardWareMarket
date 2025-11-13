# Firestore Index Setup for Listings Ordering

## Required Composite Index

To enable ordering of listings by `createdAt` with multiple where clauses, you need to create a composite index in Firestore.

### Index Details

**Collection:** `listings`

**Fields to Index:**
1. `verified` (Ascending)
2. `status` (Ascending)  
3. `createdAt` (Descending)

### How to Create the Index

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure the index as follows:
   - Collection ID: `listings`
   - Fields:
     - `verified` → Ascending
     - `status` → Ascending
     - `createdAt` → Descending
6. Click **Create**

Alternatively, Firebase will automatically prompt you to create this index when you first run a query that requires it. You can click the link in the error message to create it directly.

### What This Index Enables

- Querying listings with `where('verified', '==', true)` AND `where('status', '==', 'active')` while ordering by `createdAt` descending
- Efficient sorting of newest listings first

### Fallback Behavior

If the index doesn't exist yet, the application will:
1. Try the query with `orderBy` first
2. If it fails (index missing), fall back to querying without `orderBy`
3. Sort results client-side by `approvedAt` or `createdAt` (newest first)

This ensures listings still appear in the correct order even before the index is created.

