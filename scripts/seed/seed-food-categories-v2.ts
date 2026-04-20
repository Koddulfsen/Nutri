/**
 * Seed Food Categories v2
 *
 * Replaces the old 5-level USDA-style taxonomy with a 3-level origin-based taxonomy.
 * ~75 nodes: 6 L1, ~25 L2, ~45 L3
 *
 * Safe: food_categories FK on foods is onDelete: 'set null', so existing foods
 * just get food_category_id set to null.
 *
 * Re-runnable: deletes all existing categories first.
 */

import 'dotenv/config';
import { db } from '../../db';
import { foodCategories } from '../../db/schema';
import { sql } from 'drizzle-orm';

interface CategoryNode {
  name: string;
  description?: string;
  children?: CategoryNode[];
}

const TAXONOMY: CategoryNode[] = [
  {
    name: 'Animal',
    description: 'Protein profiles, B12, heme iron',
    children: [
      {
        name: 'Red Meat',
        description: 'Beef, pork, lamb',
        children: [
          { name: 'Beef' },
          { name: 'Pork' },
          { name: 'Lamb & Mutton' },
          { name: 'Goat' },
          { name: 'Game' },
          { name: 'Organ Meats' },
        ],
      },
      {
        name: 'Poultry',
        description: 'Chicken, turkey, duck',
        children: [
          { name: 'Chicken' },
          { name: 'Turkey' },
          { name: 'Duck' },
          { name: 'Goose' },
          { name: 'Quail' },
          { name: 'Ostrich & Emu' },
        ],
      },
      {
        name: 'Seafood',
        description: 'Fish, shellfish',
        children: [
          { name: 'Freshwater Fish' },
          { name: 'Saltwater Fish' },
          { name: 'Crustaceans' },
          { name: 'Mollusks' },
        ],
      },
      {
        name: 'Eggs',
        description: 'Chicken egg, duck egg, roe',
        children: [
          { name: 'Chicken Eggs' },
          { name: 'Duck Eggs' },
          { name: 'Quail Eggs' },
          { name: 'Fish Roe & Caviar' },
        ],
      },
      {
        name: 'Dairy',
        description: 'Milk, cheese, yogurt, butter',
        children: [
          { name: 'Milk' },
          { name: 'Cheese' },
          { name: 'Yogurt' },
          { name: 'Butter & Ghee' },
          { name: 'Cream' },
          { name: 'Frozen Dairy' },
        ],
      },
      {
        name: 'Insects',
        description: 'Cricket, mealworm',
      },
      {
        name: 'Other Animal',
        description: 'Honey, gelatin',
      },
    ],
  },
  {
    name: 'Plant',
    description: 'Fiber, phytochemicals',
    children: [
      {
        name: 'Fruits',
        description: 'Apple, banana, mango, orange',
        children: [
          { name: 'Citrus' },
          { name: 'Berries' },
          { name: 'Stone Fruits' },
          { name: 'Tropical' },
          { name: 'Pome' },
          { name: 'Melons' },
          { name: 'Grapes & Vine' },
        ],
      },
      {
        name: 'Vegetables',
        description: 'Broccoli, carrot, spinach, potato',
        children: [
          { name: 'Leafy Greens' },
          { name: 'Root Vegetables' },
          { name: 'Tubers & Starchy' },
          { name: 'Cruciferous' },
          { name: 'Nightshades' },
          { name: 'Alliums' },
          { name: 'Squash & Gourds' },
          { name: 'Stems & Shoots' },
        ],
      },
      {
        name: 'Grains & Cereals',
        description: 'Wheat, rice, oats, corn',
        children: [
          { name: 'Wheat' },
          { name: 'Rice' },
          { name: 'Corn/Maize' },
          { name: 'Oats' },
          { name: 'Barley' },
          { name: 'Rye' },
          { name: 'Millet & Sorghum' },
          { name: 'Pseudocereals' },
        ],
      },
      {
        name: 'Legumes & Pulses',
        description: 'Beans, lentils, chickpeas, peanuts',
        children: [
          { name: 'Beans' },
          { name: 'Lentils' },
          { name: 'Chickpeas' },
          { name: 'Peas' },
          { name: 'Soybeans' },
          { name: 'Peanuts' },
        ],
      },
      {
        name: 'Nuts & Seeds',
        description: 'Almond, walnut, sunflower, chia',
        children: [
          { name: 'Tree Nuts' },
          { name: 'Seeds' },
          { name: 'Coconut' },
        ],
      },
      {
        name: 'Herbs & Spices',
        description: 'Basil, turmeric, cinnamon, pepper',
      },
      {
        name: 'Plant Oils',
        description: 'Olive oil, coconut oil, sesame oil',
      },
      {
        name: 'Algae & Seaweed',
        description: 'Spirulina, nori, kelp, chlorella',
      },
      {
        name: 'Stimulant Plants',
        description: 'Coffee bean, tea leaf, cacao',
      },
      {
        name: 'Plant Sweeteners',
        description: 'Sugar cane, maple syrup, agave',
      },
    ],
  },
  {
    name: 'Fungi',
    description: 'Ergosterol, beta-glucans',
    children: [
      {
        name: 'Mushrooms',
        description: 'Button, shiitake, oyster, portobello',
      },
      {
        name: 'Yeasts',
        description: 'Nutritional yeast, brewer\'s yeast',
      },
    ],
  },
  {
    name: 'Composite',
    description: 'Multi-ingredient, no single origin',
    children: [
      { name: 'Baked Goods', description: 'Bread, cake, pastry, crackers' },
      { name: 'Pasta & Noodles', description: 'Spaghetti, ramen, rice noodle' },
      { name: 'Soups & Stews', description: 'Chicken soup, chili' },
      { name: 'Condiments & Sauces', description: 'Ketchup, soy sauce, mayo' },
      { name: 'Snacks', description: 'Chips, popcorn, pretzels' },
      { name: 'Confectionery', description: 'Candy, chocolate bars' },
      { name: 'Fast Food', description: 'Burger, fries, pizza' },
      { name: 'Frozen Meals', description: 'TV dinners, frozen pizza' },
      { name: 'Baby Foods', description: 'Purees, formula' },
    ],
  },
  {
    name: 'Supplements',
    description: 'Concentrated/extracted compounds',
    children: [
      { name: 'Vitamin Supplements', description: 'Vitamin C tablet, multivitamin' },
      { name: 'Mineral Supplements', description: 'Iron, calcium, zinc capsule' },
      { name: 'Protein Powders', description: 'Whey, casein, pea protein' },
      { name: 'Fatty Acid Supplements', description: 'Fish oil, omega-3 capsule' },
      { name: 'Herbal Supplements', description: 'Ashwagandha, echinacea' },
      { name: 'Sports Nutrition', description: 'Creatine, pre-workout' },
    ],
  },
  {
    name: 'Other',
    description: 'Inorganic: water, salt, baking ingredients',
    children: [
      { name: 'Water', description: 'Plain, sparkling, mineral' },
      { name: 'Salt & Minerals', description: 'Table salt, Himalayan salt' },
      { name: 'Baking Ingredients', description: 'Baking soda, cornstarch' },
      { name: 'Vinegar', description: 'Apple cider, balsamic' },
      { name: 'Flavor Extracts', description: 'Vanilla, almond extract' },
      { name: 'Artificial Sweeteners', description: 'Aspartame, stevia, sucralose' },
    ],
  },
];

async function seedCategories() {
  console.log('Seeding food categories v2 (3-level origin-based taxonomy)...\n');

  // Delete all existing categories (FK on foods is onDelete: 'set null')
  const deleted = await db.delete(foodCategories).returning();
  console.log(`Deleted ${deleted.length} existing categories.`);

  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;

  for (const l1 of TAXONOMY) {
    // Insert Level 1
    const [insertedL1] = await db
      .insert(foodCategories)
      .values({
        name: l1.name,
        level: 1,
        description: l1.description || null,
        parentCategoryId: null,
      })
      .returning();
    l1Count++;
    console.log(`  L1: ${l1.name}`);

    if (!l1.children) continue;

    for (const l2 of l1.children) {
      // Insert Level 2
      const [insertedL2] = await db
        .insert(foodCategories)
        .values({
          name: l2.name,
          level: 2,
          description: l2.description || null,
          parentCategoryId: insertedL1.id,
        })
        .returning();
      l2Count++;
      console.log(`    L2: ${l2.name}`);

      if (!l2.children) continue;

      for (const l3 of l2.children) {
        // Insert Level 3
        await db.insert(foodCategories).values({
          name: l3.name,
          level: 3,
          description: l3.description || null,
          parentCategoryId: insertedL2.id,
        });
        l3Count++;
        console.log(`      L3: ${l3.name}`);
      }
    }
  }

  const total = l1Count + l2Count + l3Count;
  console.log(`\nDone! Inserted ${total} categories: ${l1Count} L1, ${l2Count} L2, ${l3Count} L3`);

  // Verify counts by level
  const counts = await db
    .select({ level: foodCategories.level, count: sql<number>`count(*)` })
    .from(foodCategories)
    .groupBy(foodCategories.level)
    .orderBy(foodCategories.level);

  console.log('\nVerification (counts by level):');
  for (const row of counts) {
    console.log(`  Level ${row.level}: ${row.count}`);
  }

  process.exit(0);
}

seedCategories().catch((err) => {
  console.error('Failed to seed categories:', err);
  process.exit(1);
});
