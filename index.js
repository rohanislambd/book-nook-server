import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

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
const booksCollection = db.collection("books");

// Auth Middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
     return res.status(401).send({
    message: "Unauthorized access",
  });
  }
  
};



// post api : book add

app.post("/books", async (req, res) => {
  const newBook = req.body;
  const result = await booksCollection.insertOne(newBook);
  res.send(result);
});

//all book api
app.get("/books", async (req, res) => {
  const books = await booksCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(books);
});
//my-book
app.get("/my-book", verifyToken, async (req, res) => {
  const userEmail = req.user.email;
  const books = await booksCollection.find({userEmail: userEmail}).sort({ createdAt: -1 }).toArray();
  res.send(books);
});

//http://localhost:8000
app.get("/", (req, res) => {
  res.send({ message: "Server is runnig" });
});

app.listen(PORT, () => {
  console.log(`Server is runnig at ${PORT}`);
});
