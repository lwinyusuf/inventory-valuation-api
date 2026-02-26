import { Injectable, ConflictException, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productsRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Product with name "${dto.name}" already exists`);
    }
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async seed() {
    const products = [
      { name: 'Apple', description: 'Fresh Red Apples' },
      { name: 'Banana', description: 'Sweet Bananas' },
      { name: 'Orange', description: 'Juicy Oranges' },
    ];

    for (const p of products) {
      const exists = await this.productsRepository.findOne({ where: { name: p.name } });
      if (!exists) {
        await this.productsRepository.save(this.productsRepository.create(p));
      }
    }
  }
}
