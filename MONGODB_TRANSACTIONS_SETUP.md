# MongoDB Transactions Setup Guide

## ⚠️ Important: Transactions Requirement

The bug fixes include MongoDB transactions to prevent race conditions in stock deduction. **MongoDB transactions require a replica set**, even if it's just a single node.

## Current Setup

If your MongoDB is running as a standalone instance (default installation), transactions will fail with an error:
```
Transaction numbers are only allowed on a replica set member or mongos
```

## Solution: Convert to Single-Node Replica Set

### Option 1: Quick Setup (Recommended for Development)

1. **Stop your MongoDB service:**
   ```bash
   # Windows (as Administrator)
   net stop MongoDB
   
   # Or if running manually, stop the MongoDB process
   ```

2. **Start MongoDB as a replica set:**
   
   Create a file `mongod.conf` in your MongoDB data directory (usually `C:\Program Files\MongoDB\Server\7.0\bin\` or similar):
   
   ```yaml
   storage:
     dbPath: C:\data\db  # Your MongoDB data path
   replication:
     replSetName: "rs0"
   net:
     port: 27017
   ```

3. **Start MongoDB with the config:**
   ```bash
   mongod --config mongod.conf
   ```

4. **Initialize the replica set:**
   
   Open a new terminal and connect to MongoDB:
   ```bash
   mongo
   ```
   
   Then run:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27017" }
     ]
   })
   ```
   
   You should see: `{ "ok" : 1 }`
   
   Type `exit` to leave the mongo shell.

5. **Verify replica set status:**
   ```bash
   mongo
   rs.status()
   ```
   
   You should see the replica set is initialized.

6. **Restart your Node.js application** - transactions will now work!

### Option 2: Using Docker (If you prefer)

If you're using Docker, you can run MongoDB as a replica set:

```bash
docker run -d -p 27017:27017 --name mongodb \
  mongo:7.0 mongod --replSet rs0 --bind_ip_all

# Initialize replica set
docker exec -it mongodb mongosh --eval "rs.initiate()"
```

### Option 3: Update Connection String (If using MongoDB Atlas)

If you're using MongoDB Atlas (cloud), it already supports transactions. No changes needed to your connection string.

## Testing Transactions

After setting up the replica set, test that transactions work:

1. Start your backend server
2. Try creating an order
3. Check the logs - you should see no transaction errors

## Fallback (If you can't set up replica set)

If you cannot set up a replica set, the transactions will fail. However, the code will still work but without race condition protection. You'll see errors in the logs, but the basic functionality will continue.

**Note:** For production, you should always use a replica set for data consistency.

## Environment Variables

No changes needed to your `.env` file. The `MONGO_URI` remains the same:
```
MONGO_URI=mongodb://localhost:27017/marketdb
```

The replica set is configured at the MongoDB server level, not in the connection string.

