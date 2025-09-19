// Test script to verify the improved search functionality
const { searchSalonsAndServices } = require('./src/utils/searchUtils.js');

console.log('Testing improved search functionality...\n');

// Test cases that should now return results
const testCases = [
  'hair',
  'hair salon', 
  'salon',
  'cut',
  'style',
  'beauty'
];

testCases.forEach(query => {
  console.log(`🔍 Searching for: "${query}"`);
  try {
    const results = searchSalonsAndServices(query);
    console.log(`   Found ${results.length} results:`);
    results.slice(0, 3).forEach(result => {
      console.log(`   - ${result.salon.name} (Score: ${result.relevanceScore}) - ${result.matchReason}`);
    });
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
});