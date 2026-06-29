import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), ProductsModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
