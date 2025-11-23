# Quick Setup: MongoDB Replica Set on Localhost

## Why This is Needed
The bug fixes use MongoDB transactions to prevent race conditions. Transactions require a replica set, even with just one node.

## Step-by-Step Setup (Windows)

### Step 1: Stop MongoDB
Stop your MongoDB service:
```bash
# Option A: If running as Windows service
net stop MongoDB

# Option B: If running manually, press Ctrl+C in the terminal where MongoDB is running
```

### Step 2: Start MongoDB as Replica Set

**Option A: Using Command Line (Easiest)**

Open a new terminal/command prompt and run:
```bash
mongod --dbpath "C:\data\db" --replSet rs0 --port 27017
```

*(Replace `C:\data\db` with your actual MongoDB data directory path)*

**Option B: Using Config File**

1. Find your MongoDB installation directory (usually `C:\Program Files\MongoDB\Server\7.0\bin\`)
2. Create a file `mongod.conf` in that directory:
   ```yaml
   storage:
     dbPath: C:\data\db  # Change to your actual data path
   replication:
     replSetName: "rs0"
   net:
     port: 27017
   ```
3. Start MongoDB:
   ```bash
   mongod --config mongod.conf
   ```

### Step 3: Initialize Replica Set

Open a **NEW** terminal window (keep MongoDB running in the first one) and run:

```bash
mongosh
```

Or if you have older MongoDB:
```bash
mongo
```

Then in the MongoDB shell, run:
```javascript
rs.initiate()
```

You should see:
```json
{
  "ok" : 1
}
```

### Step 4: Verify It Worked

Still in the MongoDB shell, run:
```javascript
rs.status()
```

You should see replica set information. The prompt should also change to show `rs0:PRIMARY>` instead of just `>`.

Type `exit` to leave the shell.

### Step 5: Restart Your Node.js Backend

Now your backend will work with transactions!

## Finding Your MongoDB Data Path

If you don't know where your MongoDB data is stored:

1. Check MongoDB logs when it starts - it shows the dbPath
2. Or check Windows services:
   - Open Services (services.msc)
   - Find MongoDB service
   - Check the "Path to executable" - the data path is usually nearby

Common locations:
- `C:\data\db`
- `C:\Program Files\MongoDB\Server\7.0\data\db`
- `C:\Users\YourName\data\db`

## Making It Permanent

To make MongoDB always start as a replica set:

1. **If using Windows Service:**
   - Open Services (services.msc)
   - Find MongoDB service
   - Right-click → Properties
   - In "Start parameters", add: `--replSet rs0`
   - Restart the service

2. **Or use a config file** (as shown in Option B above) and update the service to use it.

## Testing

After setup, test by:
1. Starting your backend server
2. Creating an order
3. Check server logs - you should NOT see transaction errors

## Troubleshooting

**Error: "replSetInitiate command must be run on master"**
- Make sure MongoDB is started with `--replSet rs0`
- Try running `rs.initiate()` again

**Error: "already initialized"**
- The replica set is already set up! You're good to go.

**MongoDB won't start**
- Check if port 27017 is already in use
- Make sure you have write permissions to the data directory
- Check MongoDB logs for specific errors

## That's It!

Once the replica set is initialized, you only need to do this once. MongoDB will remember it and start as a replica set automatically.

