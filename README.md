# MultiCash: A Multi-Currency Digital Wallet

<div>
    <img src="https://i.ibb.co/2jP2Qjb/logo.png" width="80px" height="auto" />
    <img src="https://i.ibb.co/t8H5Xgd/name.png" width="200px"
    height="auto" />
</div>

## Overview

**MultiCash** is a multi-currency digital wallet designed to give users the ability to seamlessly manage, exchange, fund, and withdraw various currencies. MultiCash leverages the **tbdex SDK** to connect with multiple **PFIs (Participating Financial Institutions)** to provide users with competitive rates and low fees for currency exchanges. While designed to be global, MultiCash primarily targets African markets, where liquidity is a common issue, by offering users the ability to exchange both African and international currencies efficiently.

MultiCash aims to offer users the following core features:

- Multi-currency wallets, allowing users to hold, fund, and withdraw various currencies.
- A dynamic exchange system that finds the best exchange rates and lowest fees through different PFIs.
- Future integration of physical and virtual credit card options for easy access to funds and seamless transactions.

<div>
    <h1>UML Sequence of MultiCash Exchange System</h1>
    <img src="https://res.cloudinary.com/dfbjysygb/image/upload/v1726226345/lf2ng7zp3ab5kstcok2z.png" />
</div>

## Design Considerations

### 1. Profitability

MultiCash collects **percentage-based exchange fees** on all transactions. The exact percentage depends on the currencies being exchanged, but there is also a **maximum fee cap** for each currency to prevent excessive costs for users. These fees are deducted **upfront** from the user’s paying currency before the transaction is executed. This transparent fee structure allows users to know exactly what they will pay in advance, ensuring clarity and fairness across the platform.

In the future, MultiCash will explore additional revenue streams, such as:

- Credit card features, which generate revenue through transaction fees.
- Potential collaborations with other financial institutions and service providers for affiliate commissions.

### 2. Functionality (Handling PFI Offerings)

The primary functionality of MultiCash is its exchange feature, powered by the tbdex SDK, which handles the matching of offerings from various PFIs. When a user initiates an exchange between two currencies (e.g., Nigerian Naira to Kenyan Shilling), MultiCash queries its network of PFIs to retrieve real-time exchange offers. The app displays these options, showing users the exchange rate, applicable fees, and time required to complete the exchange.

To give users even more **optionality**, MultiCash employs an **algorithm using the Breadth-First Search (BFS)** approach. This algorithm searches through possible **chained offerings** to find alternative exchange paths. For example, if there isn’t a direct Naira to USD conversion available, the algorithm checks if a chain of conversions (e.g., Naira to Kenyan Shilling and then Kenyan Shilling to USD) is possible. By doing so, users may have the chance to find **indirect conversion chains** that offer better rates or lower fees, further enhancing the flexibility of the platform.


### 3. Customer Management (Decentralized Identifiers and Verifiable Credentials)

To comply with international KYC (Know Your Customer) standards, MultiCash collects user information, including their **name**, **country**, and **decentralized identifier (DID)**, during the signup process. This information is securely stored and used to generate verifiable credentials that can be shared with PFIs during exchange transactions.

MultiCash does not directly manage customers’ verifiable credentials but rather acts as an intermediary, verifying and sharing users' DID information with PFIs for seamless exchanges. The platform securely stores and transmits the users’ verifiable credentials, ensuring privacy and compliance.

### 4. Customer Satisfaction (Tracking Satisfaction with PFIs)

Customer satisfaction is a key component of MultiCash’s platform. After each exchange transaction, users are prompted to rate their experience, specifically how satisfied they were with the PFI’s offering, including aspects such as exchange rate, fees, and speed of transaction.

These ratings allow MultiCash to track PFI performance and maintain a database of user feedback. In the future, we plan to use this data to further optimize PFI selection for users and offer additional personalized recommendations based on satisfaction trends.

### 5. Additional Features

In addition to the core functionality, MultiCash is exploring the following features to further enhance the user experience:

- **Transaction Monitoring:** Users will have real-time updates and notifications about their exchange transactions.
- **Mobile App Integration:** MultiCash plans to work on a mobile app to give users easy access to their wallets and exchange functionalities on the go.
- **Credit Card Integration:** MultiCash plans to launch a physical and virtual credit card service, allowing users to make transactions across borders with any currency in their wallet.
