# Migrating from Mongoose to Prisma

This document outlines the migration process from Mongoose to Prisma as the database ORM for the application.

## Overview

The application previously used a mix of Mongoose and Prisma for database operations. We've migrated everything to Prisma for consistency and better type safety. Since the service hasn't started yet, no data migration is required.

## Key Changes

1. Removed Mongoose models and the MongoDB connection utility
2. Updated all API routes to use Prisma instead of Mongoose
3. Added proper handling for complex JSON data in Prisma

## Database Schema

The Prisma schema now includes the following models:

- `User`: For user authentication and profile management
- `Presentation`: For storing presentations with slides as JSON
- `Theme`: For storing theme configurations (already used Prisma)

## Handling Complex JSON Data

Prisma's MongoDB connector requires special handling for complex nested objects. The most important change is how we handle the `slides` field in the `Presentation` model:

1. When **creating** a presentation, stringify the slides object:
   ```typescript
   const presentation = await prisma.presentation.create({
     data: {
       title: "My Presentation",
       description: "Description",
       userId,
       slides: JSON.stringify(slidesData) // Convert to string
     }
   });
   ```

2. When **reading** a presentation, parse the slides string:
   ```typescript
   const presentation = await prisma.presentation.findUnique({
     where: { id: presentationId }
   });
   
   // Parse slides
   const parsedPresentation = {
     ...presentation,
     slides: typeof presentation.slides === 'string'
       ? JSON.parse(presentation.slides)
       : presentation.slides
   };
   ```

3. When **updating** a presentation with slides, stringify again:
   ```typescript
   // If slides is included in the update data, stringify it
   if (updateData.slides && typeof updateData.slides !== 'string') {
     updateData.slides = JSON.stringify(updateData.slides);
   }
   
   await prisma.presentation.update({
     where: { id: presentationId },
     data: updateData
   });
   ```

## Testing

A test file is available in `src/test/database.test.ts` to validate the JSON handling for presentation slides. Run the tests with:

```bash
npm test
```

## Common Issues

1. **Type Errors**: If you see type errors like `Type 'X' is not assignable to type 'InputJsonValue'`, make sure you're stringifying complex objects before saving them to Prisma.

2. **JSON Parsing**: When displaying or manipulating presentation data, always check if slides is a string and parse it if needed.

3. **API Responses**: Format responses to include parsed slides for consistent frontend interaction.

4. **Linter Errors with Trailing Spaces**: The current code contains some trailing spaces in the ternary expressions for parsing JSON. These appear in multiple files:
   - `src/app/api/presentations/[id]/route.ts` (lines 42, 43, 115, 116)
   - `src/app/api/presentations/trash/route.ts` (lines 43, 44, 46, 48)
   - `src/app/api/presentations/ai/route.ts` (line 61)
   
   These could be addressed by reformatting these expressions to avoid trailing spaces.

## Environment Setup

Make sure your `.env` file includes:

```
DATABASE_URL="mongodb://username:password@localhost:27017/yourdatabase?authSource=admin"
```

## Fixing Linter Errors

The codebase contains some linter errors related to trailing spaces in the ternary expressions where we parse JSON strings. To fix these errors, you can reformat the code in one of the following ways:

1. **Use a single line for simple expressions:**
   ```typescript
   slides: typeof slides === 'string' ? JSON.parse(slides) : slides
   ```

2. **Use parentheses and line breaks differently:**
   ```typescript
   slides: (
     typeof slides === 'string'
       ? JSON.parse(slides)
       : slides
   )
   ```

3. **Use a separate helper function:**
   ```typescript
   function parseSlides(slides: unknown): any {
     return typeof slides === 'string' ? JSON.parse(slides) : slides;
   }
   
   // Then use it like this:
   const presentationWithParsedSlides = {
     ...presentation,
     slides: parseSlides(presentation.slides)
   };
   ```

4. **Use a template string or more explicit formatting:**
   ```typescript
   slides: (() => {
     if (typeof slides === 'string') {
       return JSON.parse(slides);
     }
     return slides;
   })()
   ```

These approaches will help ensure the code is both functional and passes the linter checks. Choose the approach that best fits the project's coding style.

## Performance Considerations

Working with large JSON structures in MongoDB can have performance implications. Here are some best practices to consider:

1. **Limit object size**: Keep your JSON objects as small as possible. MongoDB has a document size limit of 16MB, but performance degrades well before reaching that limit.

2. **Indexing**: If you need to query specific fields within the JSON, consider extracting those fields to top-level document properties that can be indexed.

3. **Selective loading**: When retrieving presentations, use the `select` option to load only required fields when you don't need the entire slides structure.

4. **Pagination**: When loading multiple presentations, implement pagination to avoid loading too many large JSON structures at once.

5. **Compression**: Consider compressing very large slide structures before storing them as strings and decompressing them on retrieval.

6. **Caching**: Implement caching for frequently accessed presentations to reduce database load.

## Backward Compatibility

Since the service hasn't started yet, there's no need for backward compatibility considerations. All implementations will use the JSON string approach for complex nested objects from the beginning.

## JSON Utility Functions

A new utility file has been created at `src/utils/json.ts` to centralize and standardize JSON handling across the application. This file provides several functions:

- `parseJsonField<T>(data: unknown): T` - Safely parses a JSON string if needed
- `stringifyJsonField(data: unknown): string` - Safely stringifies an object if needed
- `parsePresentation<T>(presentation: T): T` - Transforms a presentation object by parsing its slides JSON
- `parsePresentations<T>(presentations: T[]): T[]` - Parses an array of presentation objects
- `getSlidesCount(slidesData: unknown): number` - Calculates the number of slides in a presentation

### Usage Examples

1. When fetching a presentation:
```typescript
import { parsePresentation } from '@/utils/json';

const presentation = await prisma.presentation.findUnique({
  where: { id },
});

return NextResponse.json(parsePresentation(presentation));
```

2. When updating a presentation:
```typescript
import { stringifyJsonField } from '@/utils/json';

const updateData = {
  ...data,
  slides: data.slides ? stringifyJsonField(data.slides) : undefined,
};

const presentation = await prisma.presentation.update({
  where: { id },
  data: updateData,
});
```

3. When fetching multiple presentations:
```typescript
import { parsePresentations } from '@/utils/json';

const presentations = await prisma.presentation.findMany();
return NextResponse.json(parsePresentations(presentations));
```

These utility functions help solve the trailing spaces linter errors by centralizing the JSON parsing/stringifying logic and removing complex ternary expressions from the API routes.

## MongoDB Replica Set Requirement

Prisma requires MongoDB to be running as a replica set to support transactions, which are used internally by Prisma. When using a standalone MongoDB instance, you might encounter the following error:

```
Invalid `prisma.presentation.create()` invocation:
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

### Setting Up MongoDB as a Replica Set

#### Option 1: Local Development Replica Set

1. Stop your existing MongoDB instance:
   ```bash
   sudo service mongod stop
   # or
   brew services stop mongodb-community
   ```

2. Create a configuration file (e.g., `mongod-replica.conf`):
   ```yaml
   replication:
     replSetName: rs0
   net:
     bindIp: localhost
     port: 27017
   storage:
     dbPath: /path/to/your/data/directory
   ```

3. Start MongoDB with the config file:
   ```bash
   mongod --config /path/to/mongod-replica.conf
   ```

4. Initialize the replica set:
   ```bash
   mongosh --eval "rs.initiate()"
   ```

5. Update your `.env.local` file:
   ```
   DATABASE_URL="mongodb://localhost:27017/presa3?replicaSet=rs0"
   ```

#### Option 2: Using MongoDB Atlas

For production environments, consider using MongoDB Atlas which provides managed replica sets:

1. Create a free MongoDB Atlas account
2. Create a new cluster (the free tier is sufficient for development)
3. Set up database access (username and password)
4. Whitelist your IP address
5. Get your connection string
6. Update your `.env.local` file:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster0.mongodb.net/presa3?retryWrites=true&w=majority"
   ```

#### Option 3: Disable Transactions (Not Recommended)

If you can't set up a replica set, you can try disabling transactions. However, this might lead to inconsistent data and is not recommended for production.

## Direct MongoDB Driver Approach

As a practical solution for development environments where setting up a MongoDB replica set might be challenging, we've created helper functions that bypass Prisma's transaction system by using the MongoDB driver directly:

```typescript
// src/utils/mongodb-helpers.ts
import { createPresentationWithoutTransaction } from '@/utils/mongodb-helpers';

// Use in your API routes
try {
  const presentation = await createPresentationWithoutTransaction({
    title: 'My Presentation',
    slides: slidesData,
    userId
  });
  // Success
} catch (err) {
  // Fall back to Prisma if needed
}
```

The helper functions provide these benefits:
1. Work without requiring a MongoDB replica set
2. Maintain the same data structure and schema
3. Provide consistent error handling
4. Fallback to standard Prisma operations when possible

The following helper functions are available:
- `createPresentationWithoutTransaction`: Creates a presentation without using transactions
- `updatePresentationWithoutTransaction`: Updates a presentation without using transactions

These functions are used in:
- `src/app/api/presentations/route.ts` (POST)
- `src/app/api/presentations/[id]/route.ts` (PUT)
- `src/app/api/ai/route.ts` (POST)

While this approach works for development, we still recommend using a MongoDB replica set for production environments to ensure data consistency and to leverage Prisma's full capabilities. 