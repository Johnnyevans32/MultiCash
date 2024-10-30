
# MultiCash: Your Multi-Currency Digital Wallet

<div style="display: flex; align-items: end;">
  <img src="https://i.ibb.co/2jP2Qjb/logo.png" width="80px" height="auto" />
  <img src="https://i.ibb.co/t8H5Xgd/name.png" width="200px" height="auto" />
  <img src="https://i.ibb.co/ysjfknF/slogan.png" width="400px" height="auto" />
</div>

## System Status

![Koyeb API Status](https://img.shields.io/uptimerobot/status/m797923764-29aead7e9fd881c282d4c32c?label=Wallet%20API%20on%20Koyeb)
![Render API Status](https://img.shields.io/uptimerobot/status/m797927084-5c7e4034776efd43a84fdd83?label=Wallet%20API%20on%20Render)
![Wallet UI Status](https://img.shields.io/uptimerobot/status/m797923761-38b5c8fc3a2fc45b2927283d?label=Wallet%20UI)



## Overview

**MultiCash** is a multi-currency digital wallet designed to give users the ability to seamlessly manage, exchange, fund, and withdraw various currencies. MultiCash leverages the **tbdex SDK** to connect with multiple **PFIs (Participating Financial Institutions)** to provide users with competitive rates and low fees for currency exchanges. While designed to be global, MultiCash primarily targets African markets, where liquidity is a common issue, by offering users the ability to exchange both African and international currencies efficiently.

**Note:** At present, MultiCash supports funding and bank account withdrawals only in Nigerian Naira (NGN) via Paystack, as it is the sole Payment Service Provider (PSP) integration implemented during the competition. Our focus was on perfecting the exchange feature, and due to time constraints, we couldn't integrate additional PSPs for other regions yet.

MultiCash aims to offer users the following core features:

- Multi-currency wallets, allowing users to hold, fund, and withdraw various currencies.
- A dynamic exchange system that finds the best exchange rates and lowest fees through different PFIs.
- Future integration of physical and virtual credit card options for easy access to funds and seamless transactions.

<div>
    <h1>MultiCash Exchange Flow via tbDEX SDK</h1>
    <img src="https://res.cloudinary.com/dfbjysygb/image/upload/v1726307315/ry44ctmlasn22yku44sd.png" />
</div>

## Design Considerations

### 1. Profitability

MultiCash collects **percentage-based exchange fees** on exchange transactions and **fixed transfer fees** on wallet withdrawal transactions. The exact percentage depends on the currencies being exchanged, but there is also a **maximum fee cap** for each currency to prevent excessive costs for users. These fees are deducted **upfront** from the user’s paying currency before the transaction is executed. This transparent fee structure allows users to know exactly what they will pay in advance, ensuring clarity and fairness across the platform.

In the future, MultiCash will explore additional revenue streams, such as:

- Credit card features, which generate revenue through transaction fees.
- Potential collaborations with other financial institutions and service providers for affiliate commissions.

### 2. Functionality (Handling PFI Offerings)

The primary functionality of MultiCash is its exchange feature, powered by the tbdex SDK, which handles the fetching of offerings from various PFIs. When a user initiates an exchange between two currencies (e.g., Nigerian Naira to Kenyan Shilling), MultiCash queries its network of PFIs to retrieve exchange offers. The app displays the matched offerings, showing users the exchange rate, applicable fees, and time required to complete the exchange.

To give users even more **optionality**, MultiCash employs an **algorithm using the Breadth-First Search (BFS)** approach. This algorithm searches through possible **chained offerings** to find alternative exchange paths. For example, if there isn’t a direct Naira to USD conversion available, the algorithm checks if a chain of conversions (e.g., Naira to Kenyan Shilling and then Kenyan Shilling to USD) is possible. By doing so, users may have the chance to find **indirect conversion chains** that offer better rates or lower fees, further enhancing the flexibility of the platform.


### 3. Customer Management (Decentralized Identifiers and Verifiable Credentials)

To comply with international KYC (Know Your Customer) standards, MultiCash collects user information, including their **name**, **country**, and **decentralized identifier (DID)**, during the signup process. This information is securely stored and used to generate verifiable credentials jwt that can be shared with PFIs during exchange transactions.

As part of MultiCash's intermediary role in the exchange process, the platform acts as the **Signer DID**, signing requests for quotes (RFQs), orders, and other relevant documents as it facilitates the sending and receiving of funds between users and Participating Financial Institutions (PFIs). Since MultiCash serves as a custodian of users’ funds within their wallets, it securely manages this signing process, ensuring that all transactions are authenticated and compliant with regulatory standards.

While MultiCash does not directly manage customers’ verifiable credentials, it acts as an intermediary, verifying and sharing users' DID information with PFIs to ensure seamless exchanges. The platform securely stores and transmits users' verifiable credentials jwt, maintaining privacy and compliance with global financial regulations.


### 4. Customer Satisfaction (Tracking Satisfaction with PFIs)

Customer satisfaction is a key component of MultiCash’s platform. After each exchange transaction, users are prompted to rate their experience, specifically how satisfied they were with the PFI’s offering, including aspects such as exchange rate, fees, and speed of transaction.

These ratings allow MultiCash to track PFI performance and maintain a database of user feedback. In the future, we plan to use this data to further optimize PFI selection for users and offer additional personalized recommendations based on satisfaction trends.

### 5. Additional Features

In addition to the core functionality, MultiCash is exploring the following features to further enhance the user experience:

- **Transaction Monitoring:** Users will have real-time updates and notifications about their exchange transactions.
- **Mobile App Integration:** MultiCash plans to work on a mobile app to give users easy access to their wallets and exchange functionalities on the go.
- **Credit Card Integration:** MultiCash plans to launch a physical and virtual credit card service, allowing users to make transactions across borders with any currency in their wallet.
