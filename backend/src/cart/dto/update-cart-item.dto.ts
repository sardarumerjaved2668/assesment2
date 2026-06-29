import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, description: 'New quantity (0 removes the item)' })
  @IsInt({ message: 'quantity must be a whole number' })
  @Min(0, { message: 'quantity cannot be negative' })
  @Type(() => Number)
  quantity: number;
}
