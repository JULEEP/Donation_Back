import mongoose from "mongoose";

const connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
    })
    .then((data) => {
      console.log(`Server is connected with server: ${data.connection.host}`);
    });
};

export default connectDatabase;