# Contract Purchase Feature Architecture

## Overview
This feature enables direct purchase flow with contract signing to prevent circumvention. Buyers must sign a contract before seeing seller contact information.

## Firestore Schema

### Contracts Collection
```javascript
{
  id: string, // Auto-generated
  listingId: string,
  sellerId: string,
  buyerId: string,
  
  // Contract Details
  contractTemplate: string, // Contract text/template
  buyerSignature: {
    data: string, // Base64 signature image
    signedAt: Timestamp,
    ipAddress: string,
    userAgent: string
  },
  sellerSignature: {
    data: string,
    signedAt: Timestamp,
    ipAddress: string,
    userAgent: string
  },
  
  // Status Management
  status: 'pending_buyer_signature' | 'pending_seller_signature' | 'both_signed' | 'cancelled',
  
  // Purchase Details
  quantity: number,
  agreedPrice: number,
  totalValue: number,
  
  // Timestamps
  createdAt: Timestamp,
  buyerSignedAt: Timestamp | null,
  sellerSignedAt: Timestamp | null,
  completedAt: Timestamp | null,
  
  // Metadata
  version: number, // Contract template version
  termsAccepted: boolean
}
```

## User Flow

### 1. Product Detail Page
- **Display**: Product specifications, pricing, quantity
- **Hidden**: Seller contact information (email, phone, company details)
- **Action**: "Purchase" button (replaces/coexists with "Make Offer")

### 2. Purchase Initiation
When buyer clicks "Purchase":
1. Validate buyer is authenticated and is a buyer
2. Create contract document in Firestore with:
   - `status: 'pending_buyer_signature'`
   - `buyerId`, `sellerId`, `listingId`
   - Contract template text
   - Purchase details (quantity, price)
3. Navigate to `/contract/:contractId`

### 3. Contract Page (Buyer View)
**Before Signing:**
- Display contract terms and conditions
- Show product details
- Show purchase summary (price, quantity, total)
- Signature pad component
- **Hidden**: Seller information

**After Buyer Signs:**
- Update contract:
  - `status: 'pending_seller_signature'`
  - Save buyer signature data
  - `buyerSignedAt: Timestamp`
- **Reveal**: Seller contact information
- Show "Contract sent to seller" message
- Provide option to download contract PDF

### 4. Seller Contract View
**Location**: `/seller/contracts` or `/seller/contracts/:contractId`

**Before Seller Signs:**
- Show contract details
- Show buyer information
- Show product details
- Signature pad
- Action buttons: "Sign Contract" or "Decline"

**After Seller Signs:**
- Update contract:
  - `status: 'both_signed'`
  - Save seller signature data
  - `sellerSignedAt: Timestamp`
  - `completedAt: Timestamp`
- Create deal in `deals` collection
- Notify buyer
- Show "Contract Completed" status

## Components Structure

```
src/
├── pages/
│   ├── ProductDetail.js (modified - hide seller info, add Purchase button)
│   ├── ContractPage.js (new - buyer contract signing)
│   ├── SellerContracts.js (new - seller contract management)
│   └── SellerContractDetail.js (new - seller contract signing view)
├── components/
│   ├── SignaturePad.js (new - reusable signature component)
│   └── ContractViewer.js (new - contract display component)
└── utils/
    └── contractTemplate.js (contract text generator)
```

## Routes

```
/product/:id → ProductDetail (with Purchase button)
/contract/:contractId → ContractPage (buyer signs)
/seller/contracts → SellerContracts (list of pending contracts)
/seller/contracts/:contractId → SellerContractDetail (seller signs)
```

## Security & Privacy Rules

### Firestore Rules
```javascript
match /contracts/{contractId} {
  // Buyers can read their own contracts
  allow read: if request.auth != null && 
    (resource.data.buyerId == request.auth.uid || 
     resource.data.sellerId == request.auth.uid);
  
  // Buyers can create contracts
  allow create: if request.auth != null && 
    request.resource.data.buyerId == request.auth.uid;
  
  // Buyers can update to sign
  allow update: if request.auth != null && 
    ((resource.data.buyerId == request.auth.uid && 
      request.resource.data.diff(resource.data).changedKeys().hasOnly(['buyerSignature', 'status', 'buyerSignedAt'])) ||
     (resource.data.sellerId == request.auth.uid && 
      request.resource.data.diff(resource.data).changedKeys().hasOnly(['sellerSignature', 'status', 'sellerSignedAt'])));
}
```

## Contract Template Structure

The contract should include:
1. Parties involved (buyer and seller names)
2. Product description
3. Purchase details (quantity, price, total)
4. Terms and conditions:
   - Payment terms
   - Delivery terms
   - Warranty information
   - Dispute resolution
   - Circumvention prevention clause
5. Signature sections for both parties

## Integration Points

### With Existing Deal System
After both parties sign:
- Automatically create deal in `deals` collection
- Set deal status to `in_progress`
- Set current step to `payment`
- Link contract ID to deal

### Notification System
- Email notification to seller when buyer signs
- Email notification to buyer when seller signs
- In-app notifications for contract status changes

## State Management

### Contract States
1. **pending_buyer_signature**: Buyer needs to sign
2. **pending_seller_signature**: Seller needs to sign
3. **both_signed**: Contract complete, deal can proceed
4. **cancelled**: Contract cancelled by either party

## UI/UX Considerations

### Product Detail Page
- Remove or hide seller information section
- Show "Contact seller" placeholder with lock icon
- Purchase button prominent
- Message: "Sign contract to view seller contact information"

### Contract Page
- Scrollable contract terms
- Clear "Sign" button
- Signature pad with clear instructions
- Progress indicator showing signing status
- Success message after signing

### Seller View
- Notification badge for pending contracts
- List view of pending contracts
- Quick actions (Sign/Decline)
- Contract history

