import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ===== PRODUCT SCHEMA OVERVIEW =====
// This schema defines a comprehensive e-commerce product management system with:
// - Products with variants, options, and pricing
// - Categories, tags, and collections for organization
// - Inventory management and sales channels
// - Flexible metadata and JSON fields for extensibility

// ===== MAIN PRODUCT TABLE =====
// This is the core table that stores basic product information
export const products = sqliteTable("products", {
  // Unique identifier for each product
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Basic product information
  title: text("title").notNull(), // Human-readable product name
  slug: text("slug").notNull().unique(), // URL-friendly identifier (e.g., "blue-tshirt")

  // Product lifecycle status
  status: text("status", {
    enum: ["draft", "proposed", "published", "rejected"],
    // draft: product is not published yet
    // proposed: product is published but waiting for approval
    // published: product is live and approved
    // rejected: product was rejected during review
  })
    .notNull()
    .default("draft"),

  // Product details
  description: text("description"), // Product description text
  thumbnail: text("thumbnail"), // Main product image URL
  images: text("images"), // JSON string containing array of image URLs

  // External system integration
  external_id: text("external_id"), // ID from external systems (e.g., Shopify, WooCommerce)
  metadata: text("metadata"), // JSON string for custom fields and data

  // SEO optimization fields
  seo_title: text("seo_title"), // Custom title for search engines
  seo_description: text("seo_description"), // Custom description for search engines

  // Product organization and categorization
  type_id: text("type_id"), // Links to product_types table (e.g., "physical", "digital")
  collection_id: text("collection_id"), // Links to product_collections table

  // Product behavior flags
  is_giftcard: integer("is_giftcard", { mode: "boolean" })
    .notNull()
    .default(false), // Whether this product is a gift card
  discountable: integer("discountable", { mode: "boolean" })
    .notNull()
    .default(true), // Whether this product can have discounts applied

  // Audit timestamps
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()), // When the product was first created
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()), // When the product was last modified
});

// ===== PRODUCT TYPES TABLE =====
// Defines different categories of products (e.g., physical goods, digital downloads, services)
export const product_types = sqliteTable("product_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  value: text("value").notNull().unique(), // e.g., "physical", "digital", "service"
  metadata: text("metadata"), // JSON string for additional type-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT COLLECTIONS TABLE =====
// Groups products into themed collections (e.g., "Summer Collection", "Holiday Sale")
export const product_collections = sqliteTable("product_collections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  title: text("title").notNull(), // Collection name
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  description: text("description"), // Collection description

  metadata: text("metadata"), // JSON string for collection-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT CATEGORIES TABLE =====
// Hierarchical categorization system for products (e.g., Electronics > Phones > Smartphones)
export const product_categories = sqliteTable("product_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(), // Category name
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  description: text("description"), // Category description

  // Hierarchical structure - allows nested categories
  parent_category_id: text("parent_category_id"), // Points to another category for nesting

  metadata: text("metadata"), // JSON string for category-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT TAGS TABLE =====
// Flexible tagging system for products (e.g., "organic", "handmade", "trending")
export const product_tags = sqliteTable("product_tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  value: text("value").notNull().unique(), // Tag name
  metadata: text("metadata"), // JSON string for tag-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT OPTIONS TABLE =====
// Defines customizable options for products (e.g., Color, Size, Material)
export const product_options = sqliteTable("product_options", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  product_id: text("product_id").notNull(), // Links to the main product
  title: text("title").notNull(), // Option name (e.g., "Color", "Size")

  metadata: text("metadata"), // JSON string for option-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT OPTION VALUES TABLE =====
// Specific values for each option (e.g., Color: "Red", "Blue", "Green")
export const product_option_values = sqliteTable("product_option_values", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  option_id: text("option_id").notNull(), // Links to product_options table
  value: text("value").notNull(), // Specific option value (e.g., "Red", "Large")

  metadata: text("metadata"), // JSON string for value-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== PRODUCT VARIANTS TABLE =====
// Different versions of a product (e.g., "Blue T-Shirt - Large", "Red T-Shirt - Medium")
export const product_variants = sqliteTable("product_variants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  product_id: text("product_id").notNull(), // Links to the main product
  title: text("title").notNull(), // Variant name (e.g., "Blue - Large")
  sku: text("sku").unique(), // Stock Keeping Unit - unique identifier for inventory
  barcode: text("barcode"), // Barcode for scanning
  upc: text("upc"), // Universal Product Code

  // Inventory management
  inventory_quantity: integer("inventory_quantity").notNull().default(0), // Current stock level
  manage_inventory: integer("manage_inventory", { mode: "boolean" })
    .notNull()
    .default(true), // Whether to track inventory for this variant

  // Variant ordering and display
  variant_rank: integer("variant_rank").notNull().default(0), // Display order

  // Physical dimensions and weight
  weight: real("weight"), // Weight in specified units
  length: real("length"), // Length dimension
  height: real("height"), // Height dimension
  width: real("width"), // Width dimension

  // Business rules
  allow_backorder: integer("allow_backorder", { mode: "boolean" })
    .notNull()
    .default(false), // Whether customers can order when out of stock

  metadata: text("metadata"), // JSON string for variant-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== MONEY AMOUNTS TABLE =====
// Handles pricing for different variants, currencies, and price lists
export const money_amounts = sqliteTable("money_amounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  variant_id: text("variant_id").notNull(), // Links to product_variants table
  currency_code: text("currency_code").notNull(), // Currency (e.g., "USD", "EUR")
  amount: integer("amount").notNull(), // Price in smallest currency unit (cents for USD)

  // Optional pricing context
  region_id: text("region_id"), // For region-specific pricing
  price_list_id: text("price_list_id"), // For different price lists (retail, wholesale)

  // Price type classification
  price_type: text("price_type", { enum: ["sale", "default"] })
    .notNull()
    .default("default"), // Whether this is a regular or sale price

  // Sale price validity period
  starts_at: integer("starts_at", { mode: "timestamp" }), // When sale price becomes active
  ends_at: integer("ends_at", { mode: "timestamp" }), // When sale price expires

  metadata: text("metadata"), // JSON string for price-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== JUNCTION TABLES =====
// These tables create many-to-many relationships between products and other entities

// Links products to categories (many products can be in many categories)
export const product_categories_products = sqliteTable(
  "product_categories_products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    product_id: text("product_id").notNull(), // Links to products table
    category_id: text("category_id").notNull(), // Links to product_categories table

    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

// Links products to tags (many products can have many tags)
export const product_tags_products = sqliteTable("product_tags_products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  product_id: text("product_id").notNull(), // Links to products table
  tag_id: text("tag_id").notNull(), // Links to product_tags table

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Links variants to option values (e.g., "Blue T-Shirt - Large" has Color=Blue, Size=Large)
export const product_variant_option_values = sqliteTable(
  "product_variant_option_values",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    variant_id: text("variant_id").notNull(), // Links to product_variants table
    option_value_id: text("option_value_id").notNull(), // Links to product_option_values table

    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

// ===== SALES CHANNELS =====
// Different platforms where products are sold (e.g., website, mobile app, marketplace)

// Sales channel definitions
export const sales_channels = sqliteTable("sales_channels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(), // Channel name (e.g., "Website", "Mobile App")
  description: text("description"), // Channel description
  is_disabled: integer("is_disabled", { mode: "boolean" })
    .notNull()
    .default(false), // Whether this channel is active

  metadata: text("metadata"), // JSON string for channel-specific data

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Links products to sales channels (many products can be sold on many channels)
export const product_sales_channels = sqliteTable("product_sales_channels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  product_id: text("product_id").notNull(), // Links to products table
  sales_channel_id: text("sales_channel_id").notNull(), // Links to sales_channels table

  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== RELATIONS =====
// These define how tables are connected to each other for efficient querying

// Product relations - defines all connections from the main products table
export const productsRelations = relations(products, ({ one, many }) => ({
  // One-to-one relationships
  type: one(product_types, {
    fields: [products.type_id], // products.type_id field
    references: [product_types.id], // references product_types.id
  }),
  collection: one(product_collections, {
    fields: [products.collection_id],
    references: [product_collections.id],
  }),

  // One-to-many relationships
  options: many(product_options), // One product can have many options
  variants: many(product_variants), // One product can have many variants
  categories: many(product_categories_products), // One product can be in many categories
  tags: many(product_tags_products), // One product can have many tags
  sales_channels: many(product_sales_channels), // One product can be sold on many channels
}));

// Product type relations - products that belong to this type
export const productTypesRelations = relations(product_types, ({ many }) => ({
  products: many(products), // One type can have many products
}));

// Product collection relations - products that belong to this collection
export const productCollectionsRelations = relations(
  product_collections,
  ({ many }) => ({
    products: many(products), // One collection can have many products
  })
);

// Product category relations - hierarchical category structure
export const productCategoriesRelations = relations(
  product_categories,
  ({ one, many }) => ({
    // Self-referencing relationship for hierarchical categories
    parent_category: one(product_categories, {
      fields: [product_categories.parent_category_id], // This category's parent
      references: [product_categories.id], // References another category
    }),
    child_categories: many(product_categories), // Categories that have this as parent
    products: many(product_categories_products), // Products in this category
  })
);

// Product tag relations - products that have this tag
export const productTagsRelations = relations(product_tags, ({ many }) => ({
  products: many(product_tags_products), // One tag can be on many products
}));

// Product option relations - values for this option
export const productOptionsRelations = relations(
  product_options,
  ({ one, many }) => ({
    product: one(products, {
      fields: [product_options.product_id],
      references: [products.id],
    }),
    values: many(product_option_values), // One option can have many values
  })
);

// Product option value relations - variants that use this value
export const productOptionValuesRelations = relations(
  product_option_values,
  ({ one, many }) => ({
    option: one(product_options, {
      fields: [product_option_values.option_id],
      references: [product_options.id],
    }),
    variants: many(product_variant_option_values), // One value can be used by many variants
  })
);

// Product variant relations - pricing and option values for this variant
export const productVariantsRelations = relations(
  product_variants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [product_variants.product_id],
      references: [products.id],
    }),
    prices: many(money_amounts), // One variant can have many prices (different currencies, etc.)
    option_values: many(product_variant_option_values), // One variant can have many option values
  })
);

// Money amount relations - which variant this price belongs to
export const moneyAmountsRelations = relations(money_amounts, ({ one }) => ({
  variant: one(product_variants, {
    fields: [money_amounts.variant_id],
    references: [product_variants.id],
  }),
}));

// ===== JUNCTION TABLE RELATIONS =====
// These connect the many-to-many relationships

// Product-category junction relations
export const productCategoriesProductsRelations = relations(
  product_categories_products,
  ({ one }) => ({
    product: one(products, {
      fields: [product_categories_products.product_id],
      references: [products.id],
    }),
    category: one(product_categories, {
      fields: [product_categories_products.category_id],
      references: [product_categories.id],
    }),
  })
);

// Product-tag junction relations
export const productTagsProductsRelations = relations(
  product_tags_products,
  ({ one }) => ({
    product: one(products, {
      fields: [product_tags_products.product_id],
      references: [products.id],
    }),
    tag: one(product_tags, {
      fields: [product_tags_products.tag_id],
      references: [product_tags.id],
    }),
  })
);

// Variant-option value junction relations
export const productVariantOptionValuesRelations = relations(
  product_variant_option_values,
  ({ one }) => ({
    variant: one(product_variants, {
      fields: [product_variant_option_values.variant_id],
      references: [product_variants.id],
    }),
    option_value: one(product_option_values, {
      fields: [product_variant_option_values.option_value_id],
      references: [product_option_values.id],
    }),
  })
);

// ===== SALES CHANNEL RELATIONS =====

// Sales channel relations - products sold on this channel
export const salesChannelsRelations = relations(sales_channels, ({ many }) => ({
  products: many(product_sales_channels), // One channel can sell many products
}));

// Product-sales channel junction relations
export const productSalesChannelsRelations = relations(
  product_sales_channels,
  ({ one }) => ({
    product: one(products, {
      fields: [product_sales_channels.product_id],
      references: [products.id],
    }),
    sales_channel: one(sales_channels, {
      fields: [product_sales_channels.sales_channel_id],
      references: [sales_channels.id],
    }),
  })
);
