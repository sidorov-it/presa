// This script initializes the MongoDB replica set
// It will run when the MongoDB container starts

// Wait until MongoDB is ready (10 seconds)
print("Waiting for MongoDB to start...");
sleep(10000);

try {
  // Try to get replica set status
  rs.status();
} catch (err) {
  // Initialize the replica set if not already done
  print("Initializing the replica set...");
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "localhost:27017" }
    ]
  });
}

// Wait for replica set to stabilize
sleep(5000);

// Check status after initialization
try {
  const status = rs.status();
  printjson(status);
  
  if (status.ok) {
    print("Replica set initialized successfully!");
  } else {
    print("Replica set initialization may have issues. Check status.");
  }
} catch (err) {
  print("Error checking replica set status: " + err);
}

// Create a test database and collection to verify functionality
db = db.getSiblingDB('slydle');
db.createCollection('test');
print("Created test collection in slydle database"); 