require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete all retailers with empty location coordinates
    const result = await mongoose.connection.db.collection('users').deleteMany({
      role: 'retailer',
      'retailerInfo.location.coordinates': { $size: 0 }
    });
    
    console.log(`Deleted ${result.deletedCount} problematic retailer(s)`);
    
    // You can also delete all retailers if needed
    // const result = await mongoose.connection.db.collection('users').deleteMany({ role: 'retailer' });
    // console.log(`Deleted ${result.deletedCount} retailer(s)`);
    
    await mongoose.connection.close();
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });