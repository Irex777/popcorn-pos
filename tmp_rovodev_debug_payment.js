// Debug payment API call
console.log("=== Payment Debug ===");

// Check current URL and API base
console.log("Current URL:", window.location.href);
console.log("Expected API base:", window.location.origin);

// Test the API endpoint manually
async function testPaymentAPI() {
  try {
    // First test if we can reach the API
    const healthResponse = await fetch('/api/health');
    console.log("Health check:", healthResponse.status, healthResponse.ok);
    
    // Get current shop ID from the page
    const shopId = 1; // Assuming shop ID 1 for testing
    const orderId = 1; // Assuming order ID 1 for testing
    
    // Test the complete payment endpoint
    const paymentResponse = await fetch(`/api/shops/${shopId}/orders/${orderId}/complete-payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date().toISOString()
      })
    });
    
    console.log("Payment API Response:", paymentResponse.status, paymentResponse.statusText);
    
    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("Payment API Error:", errorText);
    } else {
      const result = await paymentResponse.json();
      console.log("Payment API Success:", result);
    }
    
  } catch (error) {
    console.error("Payment API Exception:", error);
  }
}

// Run the test
testPaymentAPI();