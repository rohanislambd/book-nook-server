import express from "express"
import { MongoClient } from 'mongodb';
import 'dotenv/config'
import cors from "cors";

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

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


// post api : book add 

app.post('/books', async(req, res) => {
     const newBook = req.body;
     const result = await booksCollection.insertOne(newBook);
     res.send(result)
})


//http://localhost:8000
app.get('/', (req, res)=> {
    res.send({message: 'Server is runnig'})
})

app.listen(PORT, ()=>{
    console.log(`Server is runnig at ${PORT}`);
})