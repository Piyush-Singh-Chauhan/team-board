import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log(mongoURI);
    
    if (!mongoURI) {
      throw new Error('Mongo DB url undefined');
    }

    await mongoose.connect(mongoURI, {
      dbName: "team-Board",
    });
    
    console.log('MongoDB connected ');

  } catch (error) {
    console.error('connection error:', error);
    process.exit(1);
  }
};


export default connectDB;

