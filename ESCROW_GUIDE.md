# Step-by-Step Escrow Lifecycle Guide (Orders Screen)

Follow this guide to run through the entire blockchain escrow lifecycle stages on your local setup:

## 1. Accept Agreement (As Farmer / Seller)
1. Log in to the application as a **Seller**.
2. Go to the **Orders** tab (which will display "My Sales").
3. Locate the new order card (which will show the **Created** step highlighted in the pipeline and a purple `🔒 Blockchain Escrow` badge).
4. Tap **Accept Escrow Agreement**.
5. The pipeline will automatically update, highlighting the **Accepted** stage.

## 2. Deposit Funds (As Buyer)
1. Log in to the application as a **Buyer**.
2. Go to the **Orders** tab.
3. Locate the order card and tap **Deposit Escrow Funds**.
4. The pipeline will automatically update, highlighting the **Funded** stage.

## 3. Mark as Delivered (As Farmer / Seller)
1. Log in to the application as a **Seller**.
2. Go to the **Orders** tab.
3. Locate the active order and tap **Mark as Delivered**.
4. The pipeline will automatically update, highlighting the **Delivered** stage.

## 4. Release Payment / Confirm Delivery (As Buyer)
1. Log in to the application as a **Buyer**.
2. Go to the **Orders** tab.
3. Locate the order card and tap **Confirm Delivery**.
4. This action signs a transaction releasing the locked funds in the smart contract directly to the farmer.
5. The pipeline transitions to **Finished / Completed**, completing the trade!

---
*Note: If the produce quality does not meet requirements during delivery inspection, the Buyer can tap **Reject** instead of confirming, which triggers a refund of the deposit from the escrow contract back to the buyer's wallet (minus any penalty percent, if configured).*
