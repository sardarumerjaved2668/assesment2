Run all tests for the ShopNext backend.

Unit tests (cart, products, orders services):
```bash
cd backend && npm run test
```

E2E auth tests (requires running MongoDB):
```bash
cd backend && npm run test:e2e
```

Test coverage report:
```bash
cd backend && npm run test -- --coverage
```

Test files:
- src/cart/cart.service.spec.ts — cart operations, stock validation, totals
- src/products/products.service.spec.ts — stock decrement, 404, suggestions
- src/orders/orders.service.spec.ts — mock payment, checkout stock, order total
- test/auth.e2e-spec.ts — register, login, /auth/me end-to-end
