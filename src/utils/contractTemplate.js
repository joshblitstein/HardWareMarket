/**
 * Generate contract template text for a purchase
 */
export function generateContractTemplate(contractData) {
  const {
    buyerName,
    buyerEmail,
    sellerName,
    sellerCompany,
    productName,
    gpuModel,
    quantity,
    unitPrice,
    totalPrice,
    location,
    listingDetails
  } = contractData;

  const contractDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
SALES CONTRACT AGREEMENT

This Sales Contract Agreement ("Agreement") is entered into on ${contractDate} between:

SELLER:
${sellerName}
${sellerCompany ? sellerCompany : 'Individual Seller'}
(Seller)

and

BUYER:
${buyerName}
${buyerEmail}
(Buyer)

1. PRODUCT DESCRIPTION
The Seller agrees to sell and the Buyer agrees to purchase the following hardware:
- Product: ${productName}
- GPU Model: ${gpuModel}
- Quantity: ${quantity} unit(s)
- Location: ${location}
${listingDetails ? `- Additional Details: ${listingDetails}` : ''}

2. PURCHASE PRICE
- Unit Price: $${unitPrice.toLocaleString()}
- Total Price: $${totalPrice.toLocaleString()}
- Payment Terms: Payment to be secured in escrow upon contract execution

3. TERMS AND CONDITIONS

3.1 Delivery
The Seller agrees to deliver the product in accordance with the agreed delivery terms. Buyer and Seller will coordinate delivery arrangements after contract execution.

3.2 Warranty
The product is sold in its current condition as described in the listing. Any warranty terms specific to this product will be detailed separately.

3.3 Inspection Period
Buyer shall have a reasonable period to inspect the product upon delivery to verify it matches the listing description.

4. CIRCUMVENTION PREVENTION
Both parties agree not to circumvent the Nimbus platform for this transaction. All communication and transaction details must be conducted through the Nimbus platform until contract completion.

5. DISPUTE RESOLUTION
Any disputes arising from this contract shall be resolved through Nimbus platform's dispute resolution process before seeking external legal remedies.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the jurisdiction in which the Seller is located.

7. SIGNATURES
By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.

BUYER SIGNATURE:
_________________________
Date: _______________

SELLER SIGNATURE:
_________________________
Date: _______________

---
This contract was generated electronically through the Nimbus Marketplace platform.
Both parties agree that electronic signatures have the same legal effect as handwritten signatures.
`;
}

