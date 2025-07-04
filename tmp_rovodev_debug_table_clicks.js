// Debug script to test table click functionality
console.log("=== Table Click Debug Script ===");

// Check if we're on the host page
if (window.location.pathname.includes('/host')) {
  console.log("✓ On host page");
  
  // Check if tables are loaded
  const tableCards = document.querySelectorAll('[data-testid="table-card"], .cursor-pointer');
  console.log(`Found ${tableCards.length} table elements`);
  
  // Check if React is loaded
  if (window.React) {
    console.log("✓ React is loaded");
  } else {
    console.log("❌ React not found");
  }
  
  // Check for any JavaScript errors
  window.addEventListener('error', (e) => {
    console.error("JavaScript Error:", e.error);
  });
  
  // Check for network errors
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log("API Call:", args[0]);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log("API Response:", response.status, args[0]);
        return response;
      })
      .catch(error => {
        console.error("API Error:", error, args[0]);
        throw error;
      });
  };
  
  // Try to manually trigger a table click
  setTimeout(() => {
    const firstTable = document.querySelector('.cursor-pointer');
    if (firstTable) {
      console.log("Found first table, attempting click...");
      firstTable.click();
    } else {
      console.log("❌ No clickable tables found");
    }
  }, 2000);
  
} else {
  console.log("❌ Not on host page. Current path:", window.location.pathname);
}