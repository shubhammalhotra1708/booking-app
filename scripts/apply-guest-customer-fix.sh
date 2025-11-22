#!/bin/bash
# Apply the fixed create_guest_customer function to Supabase

# Read the Supabase connection details from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract project ref from NEXT_PUBLIC_SUPABASE_URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

echo "📝 Applying create_guest_customer function fix..."
echo "Project: $PROJECT_REF"

# Use Supabase CLI if available
if command -v supabase &> /dev/null; then
  supabase db execute --project-ref $PROJECT_REF --file database/functions/create_guest_customer.sql
  echo "✅ Function updated!"
else
  echo "⚠️  Supabase CLI not found. Please run the SQL manually in Supabase Dashboard:"
  echo "   1. Go to SQL Editor"
  echo "   2. Copy contents of database/functions/create_guest_customer.sql"
  echo "   3. Run the query"
fi
