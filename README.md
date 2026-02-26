# Inventory Valuation API – Take Home Assessment

## Overview

Inventory Valuation API is a RESTful backend built with NestJS to manage purchase and sale transactions while calculating Cost of Goods Sold (COGS) using the Weighted Average Cost (WAC) method.

It solves the common issue of inaccurate COGS when inventory is purchased at different prices by maintaining a recalculable transaction timeline with full transactional safety.

---

## Example Scenario (WAC)

1. Buy 150 units @ RM2.00  
   - Total Value: RM300  
   - WAC: RM2.00  

2. Buy 10 units @ RM1.50  
   - Total Value: RM315  
   - Total Qty: 160  
   - New WAC: RM1.97  

3. Sell 5 units  
   - COGS = 5 × RM1.97 = RM9.85  
   - Total Value: RM305.15
   - Total Qty: 155

<div align="center">
 <img src="./screenshots/Screenshot 2026-02-27 at 6.28.31 AM.png" width="600" alt="Dbeaver Postgres" />
  <p><i>Example Scenario</i></p>
</div>

---

## Core Capabilities

- JWT Authentication – Register & login  
- Automatic WAC Calculation – Every sale calculates COGS using current weighted average  
- Historical Transactions – Insert past transactions and automatically recalculate future records  
- Update / Delete Support – Timeline re-syncs after corrections  
- Atomic Transactions – Full rollback if recalculation causes insufficient stock  

---

## Architecture

Modular NestJS structure:

- **Auth Module** – JWT-based registration and login.
- **Products Module** – Core product management.
- **Transactions Module** – Unified handling of purchases and sales with automated WAC recalculation.
- **Users Module** – User profile and security.

---

## Tech Stack

- NestJS  
- PostgreSQL  
- TypeORM  
- Swagger API Docs

---

## Deployment

Production environment:

- AWS App Runner 
- AWS RDS (PostgreSQL)  
- Domain: https://api.lwin.my

<div align="center">
 <img src="./screenshots/Screenshot 2026-02-26 at 9.39.34 PM.png" width="600" alt="AWS App Runner" />
  <p><i>AWS App Runner</i></p>
  </br>
  <img src="./screenshots/Screenshot 2026-02-26 at 9.38.43 PM.png" width="600" alt="https://api.lwin.my" />
  <p><i><a href="https://api.lwin.my">https://api.lwin.my</a></i></p>
</div>

---

## Testing

Full E2E test suite covering:

- **Purchase flow** – Correct stock and total value tracking.
- **WAC recalculation** – Automated cost updates on transaction inserts.
- **Sale COGS accuracy** – Precise cost of goods sold based on calculated WAC.
- **Historical adjustments** – Recalculating the timeline when modifying past records.
- **Atomic Rollback** – Preventing sales that exceed available stock during recalculation.

To run the full flow test:
```bash
npm run test:e2e
```

<div align="center">
  <img src="./screenshots/Screenshot 2026-02-26 at 9.34.56 PM.png" width="600" alt="E2E Tests" />
  <p><i>E2E Test Results (100% Pass)</i></p>
</div>

---

## Local Setup

1. Copy `.env.example` to `.env`
2. Run the Docker development environment:
   ```bash
   docker-compose up --build
   ```
3. The app with Swagger documentation is available at `http://localhost:3000`.
<div align="center">
  <img src="./screenshots/Screenshot 2026-02-26 at 9.40.53 PM.png" width="600" alt="Docker" />
</div>
