import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's cart" })
  getCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add an item to the cart' })
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.id, dto.productId, dto.quantity ?? 1);
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Update a cart item quantity (0 removes it)' })
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(user.id, productId, dto.quantity);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the entire cart' })
  clear(@CurrentUser() user: AuthUser) {
    return this.cartService.clearCart(user.id);
  }
}
