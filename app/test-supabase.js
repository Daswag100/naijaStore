const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vyhzakusxrpylvdwbegz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aHpha3VzeHJweWx2ZHdiZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU2NDcsImV4cCI6MjA2NjcxMTY0N30.OfMehgMAfhlVZiAKUlvQ-rbJESTbKhotMlFPp02UwHA';

async function testConnection() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Testing Supabase connection...');
  
  try {
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    console.log('Categories:', categories);
    console.log('Categories Error:', catError);
    
    // Test products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*');
    
    console.log('Products:', products);
    console.log('Products Error:', prodError);
    
  } catch (error) {
    console.error('Connection Error:', error);
  }
}

testConnection();