// Test script to check table click functionality
console.log("Testing table click functionality...");

// Check if we're on the host page
if (window.location.pathname.includes('/host')) {
  console.log("✓ On host page");
  
  // Wait for tables to load
  setTimeout(() => {
    const tables = document.querySelectorAll('[data-testid="table-card"], .cursor-pointer');
    console.log(`Found ${tables.length} clickable table elements`);
    
    if (tables.length > 0) {
      console.log("✓ Tables found, testing click...");
      const firstTable = tables[0];
      console.log("Table element:", firstTable);
      
      // Simulate click
      firstTable.click();
      
      // Check if selection panel appears
      setTimeout(() => {
        const selectionPanel = document.querySelector('h3');
        const panels = Array.from(document.querySelectorAll('h3')).filter(h3 => 
          h3.textContent && h3.textContent.includes('Table')
        );
        console.log("Selection panels found:", panels.length);
        
        if (panels.length > 0) {
          console.log("✓ Table selection working!");
        } else {
          console.log("❌ No selection panel appeared");
        }
      }, 100);
    } else {
      console.log("❌ No tables found - check if tables are loaded");
    }
  }, 2000);
} else {
  console.log("❌ Not on host page - navigate to /host first");
}