import type { FastifyInstance } from 'fastify';

import { ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { BarcodeService } from '../services/BarcodeService.js';

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/products/barcode/:code', { preHandler: requireAuth }, async (request) => {
    const { code } = request.params as { code: string };
    const product = await BarcodeService.lookup(code);
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', `No product found for barcode ${code}`);
    }
    return product;
  });
}
