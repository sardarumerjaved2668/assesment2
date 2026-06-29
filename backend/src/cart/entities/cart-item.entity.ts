import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('cart_items')
export class CartItem {
  @ObjectIdColumn()
  id: ObjectId;

  // Reference ids (stored as id strings  MongoDB has no SQL joins).
  @Column()
  userId: string;

  @Column()
  productId: string;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
