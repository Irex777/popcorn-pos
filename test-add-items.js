// Simple test to verify the add items to order functionality
async function testAddItemsToOrder() {
  const baseUrl = 'http://localhost:3004';
  
  try {
    // Test if the endpoint exists by making a request
    const response = await fetch(`${baseUrl}/api/shops/1/orders/1/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            productId: 1,
            quantity: 2,
            price: "10.00"
          }
        ]
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAddItemsToOrder();