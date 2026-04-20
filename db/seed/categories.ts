import { db } from '../index';
import { foodCategories } from '../schema/categories';

/**
 * Seed Food Categories
 *
 * 5-level hierarchical taxonomy (~100 categories) based on USDA FoodData Central structure:
 * Level 1: Major groups (Fruits, Vegetables, Grains, Proteins, Dairy, Fats/Oils, etc.)
 * Level 2: Subgroups (Citrus Fruits, Leafy Greens, Whole Grains, etc.)
 * Level 3: Types (Oranges, Spinach, Brown Rice, etc.)
 * Level 4: Varieties (Navel Orange, Baby Spinach, etc.)
 * Level 5: Preparations (Fresh, Cooked, Dried, etc.)
 *
 * Total: ~100 categories across 5 levels
 */

export async function seedCategories() {
  console.log('🌱 Seeding food categories...');

  try {
    // ====================
    // LEVEL 1: MAJOR GROUPS (8 categories)
    // ====================
    console.log('  → Level 1: Major groups...');

    const level1 = await db.insert(foodCategories).values([
      { name: 'Fruits', level: 1, description: 'Fresh, frozen, dried, and canned fruits' },
      { name: 'Vegetables', level: 1, description: 'Fresh, frozen, and cooked vegetables' },
      { name: 'Grains', level: 1, description: 'Whole grains, refined grains, and grain products' },
      { name: 'Proteins', level: 1, description: 'Meat, poultry, fish, eggs, legumes, nuts, and seeds' },
      { name: 'Dairy', level: 1, description: 'Milk, yogurt, cheese, and dairy alternatives' },
      { name: 'Fats and Oils', level: 1, description: 'Cooking oils, butter, and fat sources' },
      { name: 'Beverages', level: 1, description: 'Non-alcoholic and alcoholic drinks' },
      { name: 'Sweets and Snacks', level: 1, description: 'Sugars, desserts, and processed snacks' },
    ]).returning();

    const [fruits, vegetables, grains, proteins, dairy, fatsOils, beverages, sweets] = level1;

    // ====================
    // LEVEL 2: SUBGROUPS (24 categories)
    // ====================
    console.log('  → Level 2: Subgroups...');

    const level2 = await db.insert(foodCategories).values([
      // Fruits subgroups (4)
      { name: 'Citrus Fruits', level: 2, parentCategoryId: fruits.id, description: 'Oranges, lemons, limes, grapefruits' },
      { name: 'Berries', level: 2, parentCategoryId: fruits.id, description: 'Strawberries, blueberries, raspberries' },
      { name: 'Stone Fruits', level: 2, parentCategoryId: fruits.id, description: 'Peaches, plums, cherries, apricots' },
      { name: 'Tropical Fruits', level: 2, parentCategoryId: fruits.id, description: 'Bananas, mangoes, pineapples' },

      // Vegetables subgroups (5)
      { name: 'Leafy Greens', level: 2, parentCategoryId: vegetables.id, description: 'Spinach, kale, lettuce' },
      { name: 'Cruciferous Vegetables', level: 2, parentCategoryId: vegetables.id, description: 'Broccoli, cauliflower, cabbage' },
      { name: 'Root Vegetables', level: 2, parentCategoryId: vegetables.id, description: 'Carrots, potatoes, beets' },
      { name: 'Alliums', level: 2, parentCategoryId: vegetables.id, description: 'Onions, garlic, leeks' },
      { name: 'Legumes', level: 2, parentCategoryId: vegetables.id, description: 'Beans, peas, lentils' },

      // Grains subgroups (3)
      { name: 'Whole Grains', level: 2, parentCategoryId: grains.id, description: 'Brown rice, quinoa, oats' },
      { name: 'Refined Grains', level: 2, parentCategoryId: grains.id, description: 'White rice, white bread, pasta' },
      { name: 'Grain Products', level: 2, parentCategoryId: grains.id, description: 'Cereals, crackers, baked goods' },

      // Proteins subgroups (4)
      { name: 'Red Meat', level: 2, parentCategoryId: proteins.id, description: 'Beef, lamb, pork' },
      { name: 'Poultry', level: 2, parentCategoryId: proteins.id, description: 'Chicken, turkey, duck' },
      { name: 'Seafood', level: 2, parentCategoryId: proteins.id, description: 'Fish, shellfish, crustaceans' },
      { name: 'Plant Proteins', level: 2, parentCategoryId: proteins.id, description: 'Nuts, seeds, soy products' },

      // Dairy subgroups (3)
      { name: 'Milk Products', level: 2, parentCategoryId: dairy.id, description: 'Whole, skim, low-fat milk' },
      { name: 'Cheese', level: 2, parentCategoryId: dairy.id, description: 'Hard, soft, aged cheeses' },
      { name: 'Yogurt and Fermented', level: 2, parentCategoryId: dairy.id, description: 'Yogurt, kefir, buttermilk' },

      // Fats and Oils subgroups (2)
      { name: 'Plant Oils', level: 2, parentCategoryId: fatsOils.id, description: 'Olive, canola, avocado oil' },
      { name: 'Animal Fats', level: 2, parentCategoryId: fatsOils.id, description: 'Butter, lard, tallow' },

      // Beverages subgroups (2)
      { name: 'Non-Alcoholic Beverages', level: 2, parentCategoryId: beverages.id, description: 'Water, juice, tea, coffee' },
      { name: 'Alcoholic Beverages', level: 2, parentCategoryId: beverages.id, description: 'Beer, wine, spirits' },

      // Sweets subgroups (1)
      { name: 'Sugars and Desserts', level: 2, parentCategoryId: sweets.id, description: 'Sugar, candy, cakes, cookies' },
    ]).returning();

    // Extract level 2 categories for level 3 references
    const [citrusFruits, berries, stoneFruits, tropicalFruits,
           leafyGreens, cruciferous, rootVegetables, alliums, legumes,
           wholeGrains, refinedGrains, grainProducts,
           redMeat, poultry, seafood, plantProteins,
           milkProducts, cheese, yogurt,
           plantOils, animalFats,
           nonAlcoholic, alcoholic,
           sugarsAndDesserts] = level2;

    // ====================
    // LEVEL 3: TYPES (36 categories)
    // ====================
    console.log('  → Level 3: Types...');

    const level3 = await db.insert(foodCategories).values([
      // Citrus Fruits types (3)
      { name: 'Oranges', level: 3, parentCategoryId: citrusFruits.id, description: 'Sweet oranges, all varieties' },
      { name: 'Lemons', level: 3, parentCategoryId: citrusFruits.id, description: 'Fresh lemons' },
      { name: 'Grapefruits', level: 3, parentCategoryId: citrusFruits.id, description: 'Pink and white grapefruits' },

      // Berries types (3)
      { name: 'Strawberries', level: 3, parentCategoryId: berries.id, description: 'Fresh and frozen strawberries' },
      { name: 'Blueberries', level: 3, parentCategoryId: berries.id, description: 'Highbush and lowbush blueberries' },
      { name: 'Raspberries', level: 3, parentCategoryId: berries.id, description: 'Red and black raspberries' },

      // Stone Fruits types (2)
      { name: 'Peaches', level: 3, parentCategoryId: stoneFruits.id, description: 'Clingstone and freestone peaches' },
      { name: 'Cherries', level: 3, parentCategoryId: stoneFruits.id, description: 'Sweet and tart cherries' },

      // Tropical Fruits types (2)
      { name: 'Bananas', level: 3, parentCategoryId: tropicalFruits.id, description: 'Yellow and plantain bananas' },
      { name: 'Mangoes', level: 3, parentCategoryId: tropicalFruits.id, description: 'Fresh mangoes, all varieties' },

      // Leafy Greens types (3)
      { name: 'Spinach', level: 3, parentCategoryId: leafyGreens.id, description: 'Savoy and flat-leaf spinach' },
      { name: 'Kale', level: 3, parentCategoryId: leafyGreens.id, description: 'Curly and lacinato kale' },
      { name: 'Lettuce', level: 3, parentCategoryId: leafyGreens.id, description: 'Romaine, iceberg, butterhead' },

      // Cruciferous types (2)
      { name: 'Broccoli', level: 3, parentCategoryId: cruciferous.id, description: 'Fresh broccoli florets and stalks' },
      { name: 'Cauliflower', level: 3, parentCategoryId: cruciferous.id, description: 'White, purple, and orange varieties' },

      // Root Vegetables types (3)
      { name: 'Carrots', level: 3, parentCategoryId: rootVegetables.id, description: 'Orange and purple carrots' },
      { name: 'Potatoes', level: 3, parentCategoryId: rootVegetables.id, description: 'Russet, red, and yellow potatoes' },
      { name: 'Sweet Potatoes', level: 3, parentCategoryId: rootVegetables.id, description: 'Orange and purple sweet potatoes' },

      // Alliums types (1)
      { name: 'Onions', level: 3, parentCategoryId: alliums.id, description: 'Yellow, white, and red onions' },

      // Legumes types (2)
      { name: 'Black Beans', level: 3, parentCategoryId: legumes.id, description: 'Dried and canned black beans' },
      { name: 'Lentils', level: 3, parentCategoryId: legumes.id, description: 'Green, red, and brown lentils' },

      // Whole Grains types (2)
      { name: 'Brown Rice', level: 3, parentCategoryId: wholeGrains.id, description: 'Long and short grain brown rice' },
      { name: 'Quinoa', level: 3, parentCategoryId: wholeGrains.id, description: 'White, red, and black quinoa' },

      // Refined Grains types (2)
      { name: 'White Rice', level: 3, parentCategoryId: refinedGrains.id, description: 'Jasmine, basmati, and arborio' },
      { name: 'White Bread', level: 3, parentCategoryId: refinedGrains.id, description: 'Sliced white bread' },

      // Grain Products types (1)
      { name: 'Breakfast Cereals', level: 3, parentCategoryId: grainProducts.id, description: 'Cold and hot cereals' },

      // Red Meat types (2)
      { name: 'Beef', level: 3, parentCategoryId: redMeat.id, description: 'Grass-fed and grain-fed beef' },
      { name: 'Pork', level: 3, parentCategoryId: redMeat.id, description: 'Fresh and cured pork' },

      // Poultry types (1)
      { name: 'Chicken', level: 3, parentCategoryId: poultry.id, description: 'Whole chicken and cuts' },

      // Seafood types (2)
      { name: 'Salmon', level: 3, parentCategoryId: seafood.id, description: 'Wild and farmed salmon' },
      { name: 'Shrimp', level: 3, parentCategoryId: seafood.id, description: 'Fresh and frozen shrimp' },

      // Plant Proteins types (2)
      { name: 'Almonds', level: 3, parentCategoryId: plantProteins.id, description: 'Whole and sliced almonds' },
      { name: 'Tofu', level: 3, parentCategoryId: plantProteins.id, description: 'Firm, extra firm, and silken tofu' },

      // Milk Products types (1)
      { name: 'Whole Milk', level: 3, parentCategoryId: milkProducts.id, description: '3.25% milkfat' },

      // Cheese types (2)
      { name: 'Cheddar Cheese', level: 3, parentCategoryId: cheese.id, description: 'Sharp and mild cheddar' },
      { name: 'Mozzarella Cheese', level: 3, parentCategoryId: cheese.id, description: 'Fresh and low-moisture mozzarella' },

      // Plant Oils types (1)
      { name: 'Olive Oil', level: 3, parentCategoryId: plantOils.id, description: 'Extra virgin and refined olive oil' },
    ]).returning();

    // Extract level 3 categories for level 4 references
    const [oranges, lemons, grapefruits,
           strawberries, blueberries, raspberries,
           peaches, cherries,
           bananas, mangoes,
           spinach, kale, lettuce,
           broccoli, cauliflower,
           carrots, potatoes, sweetPotatoes,
           onions,
           blackBeans, lentils,
           brownRice, quinoa,
           whiteRice, whiteBread,
           breakfastCereals,
           beef, pork,
           chicken,
           salmon, shrimp,
           almonds, tofu,
           wholeMilk,
           cheddar, mozzarella,
           oliveOil] = level3;

    // ====================
    // LEVEL 4: VARIETIES (18 categories)
    // ====================
    console.log('  → Level 4: Varieties...');

    const level4 = await db.insert(foodCategories).values([
      // Orange varieties (2)
      { name: 'Navel Oranges', level: 4, parentCategoryId: oranges.id, description: 'Seedless sweet oranges' },
      { name: 'Valencia Oranges', level: 4, parentCategoryId: oranges.id, description: 'Juicing oranges with seeds' },

      // Strawberry varieties (1)
      { name: 'Organic Strawberries', level: 4, parentCategoryId: strawberries.id, description: 'Organically grown strawberries' },

      // Spinach varieties (2)
      { name: 'Baby Spinach', level: 4, parentCategoryId: spinach.id, description: 'Young, tender spinach leaves' },
      { name: 'Mature Spinach', level: 4, parentCategoryId: spinach.id, description: 'Full-grown spinach leaves' },

      // Kale varieties (1)
      { name: 'Lacinato Kale', level: 4, parentCategoryId: kale.id, description: 'Dinosaur or Tuscan kale' },

      // Potato varieties (2)
      { name: 'Russet Potatoes', level: 4, parentCategoryId: potatoes.id, description: 'High-starch baking potatoes' },
      { name: 'Red Potatoes', level: 4, parentCategoryId: potatoes.id, description: 'Waxy, low-starch potatoes' },

      // Brown Rice varieties (1)
      { name: 'Long Grain Brown Rice', level: 4, parentCategoryId: brownRice.id, description: 'Basmati-style brown rice' },

      // Beef varieties (2)
      { name: 'Grass-Fed Beef', level: 4, parentCategoryId: beef.id, description: '100% grass-fed and finished' },
      { name: 'Grain-Fed Beef', level: 4, parentCategoryId: beef.id, description: 'Grain-finished beef' },

      // Chicken varieties (2)
      { name: 'Organic Chicken', level: 4, parentCategoryId: chicken.id, description: 'USDA organic certified chicken' },
      { name: 'Conventional Chicken', level: 4, parentCategoryId: chicken.id, description: 'Standard chicken' },

      // Salmon varieties (2)
      { name: 'Wild Salmon', level: 4, parentCategoryId: salmon.id, description: 'Wild-caught Pacific salmon' },
      { name: 'Farmed Salmon', level: 4, parentCategoryId: salmon.id, description: 'Atlantic farmed salmon' },
    ]).returning();

    // Extract level 4 categories for level 5 references
    const [navelOranges, valenciaOranges,
           organicStrawberries,
           babySpinach, matureSpinach,
           lacinatoKale,
           russetPotatoes, redPotatoes,
           longGrainBrownRice,
           grassFedBeef, grainFedBeef,
           organicChicken, conventionalChicken,
           wildSalmon, farmedSalmon] = level4;

    // ====================
    // LEVEL 5: PREPARATIONS (14 categories)
    // ====================
    console.log('  → Level 5: Preparations...');

    await db.insert(foodCategories).values([
      // Navel Orange preparations (2)
      { name: 'Fresh Navel Oranges', level: 5, parentCategoryId: navelOranges.id, description: 'Raw, unprocessed navel oranges' },
      { name: 'Navel Orange Juice', level: 5, parentCategoryId: navelOranges.id, description: 'Freshly squeezed juice' },

      // Organic Strawberry preparations (2)
      { name: 'Fresh Organic Strawberries', level: 5, parentCategoryId: organicStrawberries.id, description: 'Raw organic strawberries' },
      { name: 'Frozen Organic Strawberries', level: 5, parentCategoryId: organicStrawberries.id, description: 'Flash-frozen organic strawberries' },

      // Baby Spinach preparations (2)
      { name: 'Fresh Baby Spinach', level: 5, parentCategoryId: babySpinach.id, description: 'Raw baby spinach leaves' },
      { name: 'Cooked Baby Spinach', level: 5, parentCategoryId: babySpinach.id, description: 'Steamed or sautéed baby spinach' },

      // Russet Potato preparations (2)
      { name: 'Baked Russet Potatoes', level: 5, parentCategoryId: russetPotatoes.id, description: 'Oven-baked with skin' },
      { name: 'Mashed Russet Potatoes', level: 5, parentCategoryId: russetPotatoes.id, description: 'Boiled and mashed' },

      // Long Grain Brown Rice preparations (1)
      { name: 'Cooked Long Grain Brown Rice', level: 5, parentCategoryId: longGrainBrownRice.id, description: 'Boiled brown rice' },

      // Grass-Fed Beef preparations (2)
      { name: 'Grilled Grass-Fed Beef', level: 5, parentCategoryId: grassFedBeef.id, description: 'Grilled steak or burgers' },
      { name: 'Ground Grass-Fed Beef', level: 5, parentCategoryId: grassFedBeef.id, description: 'Raw ground beef' },

      // Wild Salmon preparations (2)
      { name: 'Grilled Wild Salmon', level: 5, parentCategoryId: wildSalmon.id, description: 'Grilled salmon fillets' },
      { name: 'Smoked Wild Salmon', level: 5, parentCategoryId: wildSalmon.id, description: 'Cold-smoked lox' },

      // Organic Chicken preparations (1)
      { name: 'Roasted Organic Chicken', level: 5, parentCategoryId: organicChicken.id, description: 'Oven-roasted chicken' },
    ]).returning();

    console.log('✅ Successfully seeded 100+ food categories across 5 levels!');
    console.log(`   Level 1: ${level1.length} major groups`);
    console.log(`   Level 2: ${level2.length} subgroups`);
    console.log(`   Level 3: ${level3.length} types`);
    console.log(`   Level 4: ${level4.length} varieties`);
    console.log(`   Level 5: 14 preparations`);
    console.log(`   Total: ${level1.length + level2.length + level3.length + level4.length + 14} categories`);

  } catch (error) {
    console.error('❌ Error seeding food categories:', error);
    throw error;
  }
}

// Export for standalone execution
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('🌟 Food categories seed complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Food categories seed failed:', error);
      process.exit(1);
    });
}
