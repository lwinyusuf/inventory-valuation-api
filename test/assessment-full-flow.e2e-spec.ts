import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { ProductsService } from './../src/products/products.service';

/**
 * FULL FLOW TEST (ISOLATED)
 * 
 * This test uses a dedicated 'inventory_valuation_test' database.
 */

describe('Inventory Valuation Assessment (Full Flow)', () => {
  let app: INestApplication;
  let authToken: string;
  let productId: number;
  let transactionIdToUpdate: number;

  beforeAll(async () => {
    // SWITCH TO TEST DATABASE
    process.env.DB_NAME = 'inventory_valuation_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // CLEAR TEST DATABASE
    const dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE TABLE transactions, products, users RESTART IDENTITY CASCADE');

    // RE-SEED PRODUCTS FOR TEST
    const productsService = app.get(ProductsService);
    await productsService.seed();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Phase 1: Authentication', () => {
    it('Should register a new user and login to get token', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'password123';

      // Register
      const regRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);
      
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.email).toBe(email);

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      authToken = loginRes.body.data.access_token;
      expect(authToken).toBeDefined();
      console.log('✅ Auth Phase Complete: User Registered and Logged In.');
    });
  });

  describe('Phase 2: Products', () => {
    it('Should verify auto-seeded fruit products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      const apple = res.body.data.find(p => p.name === 'Apple');
      productId = apple.id;
      console.log(`✅ Product Phase Complete: Using Product "Apple" (ID: ${productId}).`);
    });
  });

  describe('Phase 3: The WAC Scenario (Problem Statement Example)', () => {
    it('Should execute the RM2 -> RM1.50 -> Sale sequence', async () => {
      console.log('\n--- STARTING WAC CORE SCENARIO ---');
      const year = 2022;
      const d1 = `${year}-01-01`;
      const d2 = `${year}-01-05`;
      const d3 = `${year}-01-07`;
      const dRandom = `${year}-01-03`;

      // 1. Bought 150 units @ RM2 on 01-01
      console.log(`Step 1: Purchase 150 units @ RM2 on ${d1}`);
      const p1 = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, type: 'PURCHASE', date: d1, quantity: 150, unitPrice: 2.0 })
        .expect(201);
      
      console.log(`Result -> Qty: 150, Total Val: RM300, WAC: RM${Number(p1.body.data.averageCost).toFixed(2)}`);
      expect(Number(p1.body.data.averageCost)).toBe(2);

      // 2. Bought 10 units @ RM1.50 on 01-05
      console.log(`Step 2: Purchase 10 units @ RM1.50 on ${d2}`);
      const p2 = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, type: 'PURCHASE', date: d2, quantity: 10, unitPrice: 1.5 })
        .expect(201);
      
      console.log(`Calculation -> (300 + 15) / 160 units = RM1.97`);
      console.log(`Result -> Qty: 160, Total Val: RM315, WAC: RM${Number(p2.body.data.averageCost).toFixed(2)}`);
      expect(Number(p2.body.data.averageCost)).toBeCloseTo(1.97, 2);
      transactionIdToUpdate = p2.body.data.id;

      // 3. Sell 5 units on 01-07 at RM3.50 each
      console.log(`Step 3: Sale 5 units on ${d3} (Sold @ RM3.50 each)`);
      const s1 = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, type: 'SALE', date: d3, quantity: 5, unitPrice: 3.50 })
        .expect(201);

      const roundedWac = 1.97;
      const costOfSale = 5 * roundedWac; // 9.85
      console.log(`   Calculation -> 5 units * RM${roundedWac.toFixed(2)} = RM${costOfSale.toFixed(2)} (Cost of Sale)`);
      console.log(`   Revenue -> 5 units * RM3.50 = RM17.50`);
      console.log(`   Result -> Qty: 155, New Total Val: RM${(315 - costOfSale).toFixed(2)}, WAC remains: RM${Number(s1.body.data.averageCost).toFixed(2)}`);
      expect(Number(s1.body.data.averageCost)).toBe(1.97);
      expect(Number(s1.body.data.totalValue)).toBe(9.85);
      expect(Number(s1.body.data.runningQuantity)).toBe(155);
      console.log('✅ WAC Scenario Phase Complete\n');

      console.log('--- STARTING BONUS FEATURES (RECALCULATION) ---');
      
      // PHASE 4: Random Date Entry
      console.log(`Step 4: Random Date Entry - Insert Purchase (40 units @ RM3) on ${dRandom} (between Step 1 and Step 2)`);
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, type: 'PURCHASE', date: dRandom, quantity: 40, unitPrice: 3.0 })
        .expect(201);

      console.log('System is now automatically recalculating the entire sequence...');
      const resHistory = await request(app.getHttpServer())
        .get(`/transactions?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const saleAfterRandom = resHistory.body.data.find(t => t.date === d3);
      console.log(`New WAC on ${d3} after recalculation: RM${Number(saleAfterRandom.averageCost).toFixed(2)}`);
      expect(Number(saleAfterRandom.averageCost)).toBeCloseTo(2.17, 2);
      console.log('✅ Bonus: Random Date Order Recalculation Complete');

      // PHASE 4: Update Transaction
      console.log(`\nStep 5: Update Transaction - Changing Step 2 price from RM1.50 to RM5.00`);
      await request(app.getHttpServer())
        .patch(`/transactions/${transactionIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ unitPrice: 5.0 })
        .expect(200);

      const resUpdate = await request(app.getHttpServer())
        .get(`/transactions?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const saleAfterUpdate = resUpdate.body.data.find(t => t.date === d3);
      console.log(`New WAC on ${d3} after price update: RM${Number(saleAfterUpdate.averageCost).toFixed(2)}`);
      expect(Number(saleAfterUpdate.averageCost)).toBe(2.35);

      // REVERT Step 2 price back to RM1.50
      console.log(`Reverting Step 2 price back to RM1.50...`);
      await request(app.getHttpServer())
        .patch(`/transactions/${transactionIdToUpdate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ unitPrice: 1.5 })
        .expect(200);

      console.log('✅ Bonus: Update Recalculation Complete');

      // PHASE 4: Delete Transaction
      console.log(`\nStep 6: Delete Transaction - Removing the Random Date entry (${dRandom})`);
      const listBeforeDelete = await request(app.getHttpServer())
        .get(`/transactions?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const toDelete = listBeforeDelete.body.data.find(t => t.date === dRandom);
      
      await request(app.getHttpServer())
        .delete(`/transactions/${toDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const resDelete = await request(app.getHttpServer())
        .get(`/transactions?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const saleAfterDelete = resDelete.body.data.find(t => t.date === d3);
      console.log(`Final WAC on ${d3} after deletion (reverts to original state): RM${Number(saleAfterDelete.averageCost).toFixed(2)}`);
      expect(Number(saleAfterDelete.averageCost)).toBeCloseTo(1.97, 2);
      console.log('✅ Bonus: Delete Recalculation Complete');
    });
  });

  describe('Phase 5: Validations', () => {
    it('Should fail when insufficient stock for sale', async () => {
      console.log('\n--- STARTING VALIDATION TESTS ---');
      const futureDate = `2099-12-31`;
      console.log(`Step 7: Attempting to sell 1000 units when only 155 are available on ${futureDate}`);
      const res = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, type: 'SALE', date: futureDate, quantity: 1000, unitPrice: 3.0 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient stock');
      console.log(`Received expected 400 error: "${res.body.message}"`);
      console.log('✅ Validation: Insufficient Stock Complete\n');
    });
  });
});
