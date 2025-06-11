import { storage } from '../storage';
import { db } from '../db'; // For potential cleanup or connection management
import { products as productsTable, categories as categoriesTable, shops as shopsTable, type InsertProduct, type Product, type Shop, type Category } from '@shared/schema';
import { eq } from 'drizzle-orm';

const logTest = (message: string, success: boolean) => {
  console.log(`[${success ? 'PASS' : 'FAIL'}] ${message}`);
  if (!success) throw new Error(`Test failed: ${message}`); // Optional: throw to stop on first failure
};

async function runProductCostTests() {
  let testShop: Shop | undefined;
  let testCategory: Category | undefined;
  let createdProduct: Product | undefined;

  // Default admin user ID for createdById, consistent with system-test
  const adminUserId = 0;

  try {
    console.log("Starting product cost tests...");

    // Setup
    testShop = await storage.createShop({ name: "Test Shop - Cost Test", createdById: adminUserId });
    logTest("Setup: Test shop created", !!testShop);

    // Ensure 'color' is provided for category creation as it's a required field.
    testCategory = await storage.createCategory({ name: "Test Category - Cost Test", shopId: testShop.id, color: "#FF0000" });
    logTest("Setup: Test category created", !!testCategory);

    // Test 1: Create Product with Cost
    const productData: InsertProduct = {
      name: "Test Product Cost",
      price: "20.00",
      cost: "10.00",
      categoryId: testCategory.id,
      stock: 50,
      shopId: testShop.id,
      imageUrl: ""
    };
    createdProduct = await storage.createProduct(productData);
    logTest("Create Product: Product created with cost", createdProduct && createdProduct.cost === "10.00");

    // Test 2: Get Product and Verify Cost
    if (createdProduct) {
      const retrievedProduct = await storage.getProduct(createdProduct.id);
      logTest("Get Product: Cost is correct", retrievedProduct && retrievedProduct.cost === "10.00");

      // Test 3: Update Product Cost
      // Important: storage.updateProduct expects ALL fields from InsertProduct.
      // So, we need to provide all of them, not just the cost.
      // The `insertProductSchema` defines what's expected for an insert/update.
      // `retrievedProduct` is of type `Product`, which includes `id`.
      // `InsertProduct` (which `updateProduct` takes) should not have `id`.
      const updateData: InsertProduct = {
        name: retrievedProduct.name,
        price: retrievedProduct.price, // Keep existing price
        cost: "12.00", // New cost
        categoryId: retrievedProduct.categoryId,
        stock: retrievedProduct.stock,
        shopId: retrievedProduct.shopId,
        imageUrl: retrievedProduct.imageUrl || "" // Ensure imageUrl is a string
      };
      const updatedProduct = await storage.updateProduct(createdProduct.id, updateData);
      logTest("Update Product: Cost updated", updatedProduct && updatedProduct.cost === "12.00");

      // Test 4: Get Product and Verify Updated Cost
      const retrievedAfterUpdate = await storage.getProduct(createdProduct.id);
      logTest("Get Updated Product: Cost is correct after update", retrievedAfterUpdate && retrievedAfterUpdate.cost === "12.00");
    }

    console.log("All product cost tests passed!");

  } catch (error) {
    console.error("Error during product cost tests:", error);
    throw error; // Re-throw to ensure the script exits with an error code if tests fail
  } finally {
    console.log("Cleaning up test data...");
    // Prioritize direct DB deletion for cleanup robustness, especially if storage methods have logic
    // that might prevent deletion (e.g., category not empty).
    // However, the prompt asked to start with storage methods. Let's stick to that for now.

    if (createdProduct && createdProduct.id) {
      try {
        await storage.deleteProduct(createdProduct.id);
        logTest("Cleanup: Product deleted via storage", true);
      } catch (e) {
        logTest("Cleanup: Failed to delete product via storage", false);
        console.error(e);
        // Fallback direct deletion if storage fails (e.g. due to order_items FK)
        // await db.delete(productsTable).where(eq(productsTable.id, createdProduct.id));
        // logTest("Cleanup: Product deleted directly from DB", true);
      }
    }
    if (testCategory && testCategory.id) {
      try {
        await storage.deleteCategory(testCategory.id);
        logTest("Cleanup: Category deleted via storage", true);
      } catch (e) {
        logTest("Cleanup: Failed to delete category via storage", false);
        console.error(e);
        // Fallback direct deletion
        // await db.delete(categoriesTable).where(eq(categoriesTable.id, testCategory.id));
        // logTest("Cleanup: Category deleted directly from DB", true);
      }
    }
    if (testShop && testShop.id) {
      try {
        await storage.deleteShop(testShop.id);
        logTest("Cleanup: Shop deleted via storage", true);
      } catch (e) {
        logTest("Cleanup: Failed to delete shop via storage", false);
        console.error(e);
        // Fallback direct deletion
        // await db.delete(shopsTable).where(eq(shopsTable.id, testShop.id));
        // logTest("Cleanup: Shop deleted directly from DB", true);
      }
    }
    // Drizzle with node-postgres typically manages connections in a pool,
    // and scripts usually exit cleanly without needing explicit db.end().
    // If the script hangs, `process.exit()` might be reintroduced.
  }
}

runProductCostTests()
  .then(() => {
    console.log("Test script finished successfully.");
    // process.exit(0); // Indicate success
  })
  .catch(e => {
    console.error("Test script failed:", e.message);
    // process.exit(1); // Indicate failure
  });
