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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

const NOT_IMPLEMENTED = { message: 'Not implemented yet', statusCode: 501 };

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  @Get()
  @ApiOperation({ summary: 'Get cart items' })
  findAll() {
    return NOT_IMPLEMENTED;
  }

  @Post()
  @ApiOperation({ summary: 'Add item to cart' })
  create(@Body() _body: any) {
    return NOT_IMPLEMENTED;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cart item' })
  update(@Param('id') _id: string, @Body() _body: any) {
    return NOT_IMPLEMENTED;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove cart item' })
  remove(@Param('id') _id: string) {
    return NOT_IMPLEMENTED;
  }
}
