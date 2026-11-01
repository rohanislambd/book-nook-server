import express from "express"
import { MongoClient } from 'mongodb';
import 'dotenv/config'

const app = express();
const PORT = 8000;



//connect database


const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("book-nook");
const  booksCollection = db.collection("books")





//http://localhost:8000
app.get('/', (req, res)=> {
    res.send({message: 'Server is runnig'})
})

app.listen(PORT, ()=>{
    console.log(`Server is runnig at ${PORT}`);
})