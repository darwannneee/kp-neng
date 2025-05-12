# Database Migration: Product Variants and Sizes

This folder contains SQL scripts to manage the database schema and migrations for the Ecoute e-commerce application.

## Migration to Product Variants and Sizes

We've updated the product model to support product variants and sizes. This is a significant enhancement that allows:

- Multiple variants per product (replacing the old "colours" field)
- Different sizes per variant
- Stock tracking at the size level
- Different images and prices for each variant

## Database Schema Changes

The following new tables have been added:

1. `product_variants` - Stores variants for each product
2. `sizes` - Stores available size options (XS, S, M, L, XL, etc.)
3. `variant_sizes` - Join table that connects variants to sizes with stock information

## How to Apply Migrations

To apply these database changes to your Supabase instance:

1. First, ensure you're connected to your Supabase database via SQL Editor or CLI
2. Run the base schema updates:
   ```sql
   \i product_variants.sql
   ```
3. Migrate existing products (this will convert the 'colours' field to actual variants):
   ```sql
   \i migrate_colours_to_variants.sql
   ```

## API Changes

The API endpoints have been updated to support variants:

- Product endpoints now accept an `include_variants=true` parameter to include variant data
- New endpoints have been added:
  - `/api/variants` - For managing product variants
  - `/api/variants/sizes` - For managing variant sizes
  - `/api/sizes` - For managing available sizes

## Backend Structure

- The `colours` field is kept in the `products` table for backward compatibility but will be phased out
- New database types have been defined in `utils/types.ts`
- API endpoints have been updated to support the new data model 