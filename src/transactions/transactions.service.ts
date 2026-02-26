import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ProductsService } from '../products/products.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateTransactionDto, user: User) {
    const product = await this.productsService.findOne(dto.productId);

    return this.dataSource.transaction(async (manager) => {
      // Check one transaction per date
      const existing = await manager.findOne(Transaction, {
        where: { date: dto.date, product: { id: product.id } },
      });
      if (existing) {
        throw new ConflictException(`A transaction already exists for date ${dto.date}`);
      }

      // Unit price validation
      if (dto.unitPrice === undefined) {
        throw new BadRequestException('unitPrice is required for the transaction');
      }

      // Create the transaction
      const transaction = manager.create(Transaction, {
        ...dto,
        product,
        user,
        averageCost: 0,
        totalValue: 0,
        runningQuantity: 0,
        runningTotalValue: 0,
      });

      const savedTransaction = await manager.save(transaction);

      // Recalculate only from this date onwards
      await this.recalculateProductCosts(product.id, manager, dto.date);

      return manager.findOne(Transaction, { where: { id: savedTransaction.id } });
    });
  }

  async findAll(productId?: number) {
    const query = this.transactionsRepository.createQueryBuilder('t')
      .leftJoinAndSelect('t.product', 'product')
      .orderBy('t.date', 'ASC')
      .addOrderBy('t.id', 'ASC');

    if (productId) {
      query.where('product.id = :productId', { productId });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async update(id: number, dto: Partial<CreateTransactionDto>) {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, { where: { id } });
      if (!transaction) throw new NotFoundException('Transaction not found');

      const originalDate = transaction.date;
      const newDate = dto.date || originalDate;

      if (dto.date && dto.date !== originalDate) {
        const existing = await manager.findOne(Transaction, {
          where: { date: dto.date, product: { id: transaction.product.id } },
        });
        if (existing) {
          throw new ConflictException(`A transaction already exists for date ${dto.date}`);
        }
      }

      Object.assign(transaction, dto);
      await manager.save(transaction);

      // Recalculate from the earliest affected date
      const startDate = originalDate < newDate ? originalDate : newDate;
      await this.recalculateProductCosts(transaction.product.id, manager, startDate);
      
      return manager.findOne(Transaction, { where: { id } });
    });
  }

  async delete(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, { where: { id } });
      if (!transaction) throw new NotFoundException('Transaction not found');

      const productId = transaction.product.id;
      const startDate = transaction.date;
      await manager.remove(transaction);

      // Recalculate from the date of the deleted transaction
      await this.recalculateProductCosts(productId, manager, startDate);
      return { message: 'Transaction deleted successfully' };
    });
  }

  /**
   * The core WAC calculation logic
   * Optimized to only recalculate from a specific start date onwards
   */
  private async recalculateProductCosts(productId: number, manager: EntityManager, startDate: string) {
    // Get "Starting Snapshot" from the transaction immediately BEFORE the startDate
    const prevTransaction = await manager.createQueryBuilder(Transaction, 't')
      .where('t.product_id = :productId', { productId })
      .andWhere('t.date < :startDate', { startDate })
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .getOne();

    let runningQuantity = prevTransaction ? Number(prevTransaction.runningQuantity) : 0;
    let runningTotalValue = prevTransaction ? Number(prevTransaction.runningTotalValue) : 0;
    let currentAverageCost = prevTransaction ? Number(prevTransaction.averageCost) : 0;

    // Fetch and process all transactions FROM the startDate onwards
    const transactions = await manager.createQueryBuilder(Transaction, 't')
      .where('t.product_id = :productId', { productId })
      .andWhere('t.date >= :startDate', { startDate })
      .orderBy('t.date', 'ASC')
      .addOrderBy('t.id', 'ASC')
      .getMany();

    for (const t of transactions) {
      const qty = Number(t.quantity);

      if (t.type === TransactionType.PURCHASE) {
        const price = Number(t.unitPrice);
        const purchaseValue = qty * price;

        runningTotalValue += purchaseValue;
        runningQuantity += qty;

        currentAverageCost = runningQuantity > 0 ? runningTotalValue / runningQuantity : 0;

        t.totalValue = purchaseValue;
        t.averageCost = currentAverageCost;
              } else {
                // SALE
                if (runningQuantity < qty) {
                  throw new BadRequestException(
                    `Insufficient stock for sale on ${t.date}. Available: ${runningQuantity}, Requested: ${qty}`
                  );
                }
      
                // Round WAC to 2 decimals before calculating sale cost
                const roundedWac = Math.round(currentAverageCost * 100) / 100;
                const saleCostValue = qty * roundedWac;
      
                t.totalValue = saleCostValue;
                t.averageCost = roundedWac;
      
                runningTotalValue -= saleCostValue;
                runningQuantity -= qty;
              }
      // Update the snapshots for the next transaction in the sequence
      t.runningQuantity = runningQuantity;
      t.runningTotalValue = runningTotalValue;

      await manager.save(t);
    }
  }
}
