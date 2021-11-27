# Subscrypt
Subscrypt is a decentralised subscription service for creators and their supporters.

![Demo](https://github.com/Subscrypt/Subscrypt/blob/master/demo.gif)

### Team
Project Idea and Business Strategy by [@Uppers](https://github.com/Uppers)

UI Design,
Frontend Development (React + Redux in typescript), and
Algorand Smart Contract Development (PyTeal / Python)
by [@fionnachan](https://github.com/fionnachan)

### Supported Wallets
1. Algorand Wallet
2. MyAlgo Wallet
3. AlgoSigner

### Features for Creators
1. Create a subscription plan (deploy a smart contract) with `creator name`, `plan name`, `plan description` and `monthly price`. (✔️completed feature)
2. See their own created plans on a dashboard. (✔️completed feature)
3. Delete a subscription plan (destroy the smart contract) on the dashboard. (✔️completed feature)

### Features for Supporters
1. Subscribe to a subscription plan. (✔️completed feature)
2. See their subscribed plans on a dashboard. (✔️completed feature)
3. Unsubscribe a plan on the dashboard. (partially completed: ✔️️UI ❌Smart Contract)

### Wallet-related Features
- show account's Algo balance & disconnect wallet
- remember wallet after page refresh if user did not disconnect their wallet
- wallet details are saved in Redux Store and therefore are available to every component in the app's codebase

### Disclaimer
This project is not audited and should not be used in a production environment.