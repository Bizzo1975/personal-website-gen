#!/bin/bash

# Script to fix models and database dependencies

echo "Starting model and database fixes..."

# Create a db-init.js file to properly initialize all models
cat > src/lib/db-init.js << 'EOL'
// This file ensures all models are registered in the right order
import mongoose from 'mongoose';
import './models/User';
import './models/Post';
import './models/Page';
import './models/Profile';
import './models/Project';

// Export nothing - this file is just for side effects
EOL

# Update the main db.ts file to import the initialization
echo "Updating database connection file..."
cat > src/lib/db-init.ts << 'EOL'
// This file ensures all models are registered in the right order
import mongoose from 'mongoose';
import './models/User';
import './models/Post';
import './models/Page';
import './models/Profile';
import './models/Project';

// Export nothing - this file is just for side effects
EOL

# Now update the main db.ts file to import the initialization
DBFILE="src/lib/db.ts"
if grep -q "import './db-init';" $DBFILE; then
  echo "DB init import already exists"
else
  # Add the import at the beginning of the file
  sed -i '1s/^/import ".\/db-init";\n/' $DBFILE
  echo "Added DB init import to $DBFILE"
fi

echo "Model fixes applied!"
echo "Restart your server with 'npm run dev' to apply the changes."

exit 0 