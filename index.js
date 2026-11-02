import express from "express";
import { MongoClient, ObjectId } from "mongodb";
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
const borrowCollection = db.collection("borrows");

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

app.post("/books", verifyToken, async (req, res) => {
  const newBook = req.body;
  const result = await booksCollection.insertOne(newBook);
  res.send(result);
});

//all book api
app.get("/books", async (req, res) => {
  const books = await booksCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(books);
});

//book details page api
app.get("/books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await booksCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

//my-book
app.get("/my-book", verifyToken, async (req, res) => {
  const userEmail = req.user.email;
  const books = await booksCollection
    .find({ userEmail: userEmail })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(books);
});

//my book update patch api
app.patch("/books/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updateData = req.body;
  const requestedEmail = req.user.email;
  //  find book
  const book = await booksCollection.findOne({ _id: new ObjectId(id) });
   if (!book) {
    return res.status(404).send({ message: "Book not found!" });
  }

  // Check book ownership before allowing the update

  if (book.userEmail !== requestedEmail) {
    return res.status(403).send({
      message: "Forbidden! You can only edit your own books.",
    });
  }

  const newAvailable = Number(updateData.availableCopies);
  if (Number.isNaN(newAvailable) || newAvailable < 0) {
    return res.status(400).send({ message: "Invalid availableCopies" });
  }

  // 4. Calculate new totalCopies 
  const oldTotal = Number(book.totalCopies) || 0;
  const oldAvailable = Number(book.availableCopies) || 0;
  const borrowedCount = Math.max(0, oldTotal - oldAvailable);
  // Calculate total copies by adding the number of already borrowed books.
  const newTotalCopies = newAvailable + borrowedCount;  

  const result = await booksCollection.updateOne(
    { _id: new ObjectId(id), userEmail: requestedEmail },
    
      {
        $set: {
          title: updateData.title ?? book.title,
          author: updateData.author ?? book.author,
          category: updateData.category ?? book.category,
          coverImage: updateData.coverImage ?? book.coverImage,
          description: updateData.description ?? book.description,
         availableCopies: newAvailable,
        totalCopies: newTotalCopies,
        },
      },
    
  );
  res.send(result);
});


//my book update patech

// borrow  post api
app.post("/borrows", verifyToken, async (req, res) => {
  const borrowData = req.body;
  const bookObjectId = new ObjectId(borrowData.bookId);

  //check already borrow
  const existingBorrow = await borrowCollection.findOne({
    bookId: borrowData.bookId,
    borrowerEmail: borrowData.borrowerEmail,
  });

  if (existingBorrow) {
    return res
      .status(400)
      .send({ message: "You have already borrowed this book!" });
  }

  // available copies
  const book = await booksCollection.findOne({ _id: bookObjectId });

  //check
  // console.log("Received bookId:", bookObjectId);
  // console.log("Found book:", book);
  // console.log("Available copies:", book?.availableCopies)

  if (!book || book.availableCopies <= 0) {
    return res.status(400).send({ message: "No copies available right now." });
  }

  const result = await borrowCollection.insertOne(borrowData);
  await booksCollection.updateOne(
    { _id: bookObjectId },
    { $inc: { availableCopies: -1 } },
  );

  res.send(result);
});

// Check existing borrow API
app.get("/borrows/check", verifyToken, async (req, res) => {
  const { bookId } = req.query;
  const borrowerEmail = req.user.email;

  const existingBorrow = await borrowCollection.findOne({
    bookId,
    borrowerEmail,
  });

  if (existingBorrow) {
    return res.send({ alreadyBorrowed: true });
  }

  res.send({ alreadyBorrowed: false });
});

//my borrow book auto return
// Automatically return books when their returnDate has passed
const autoReturnExpiredBooks = async () => {
  const today = new Date().toISOString().split("T")[0];
  // 1. Find borrowed books whose returnDate is earlier than today's date ($lt)
  const expiredBorrows = await borrowCollection
    .find({ returnDate: { $lt: today } })
    .toArray();
  // 2. Delete each expired borrow record and increase the available copies of the book by 1
  for (const item of expiredBorrows) {
    await borrowCollection.deleteOne({ _id: item._id });
    await booksCollection.updateOne(
      { _id: new ObjectId(item.bookId) },
      { $inc: { availableCopies: 1 } },
    );
  }
};

//my borrow get api
app.get("/borrows", verifyToken, async (req, res) => {
  // check auto retun
  await autoReturnExpiredBooks();
  const email = req.user.email;

  const result = await borrowCollection
    .find({ borrowerEmail: email })
    .sort({ borrowDate: -1 })
    .toArray();

  res.send(result);
});

// my borrow delete api
app.delete("/borrows/:id", verifyToken, async (req, res) => {
  const borrowId = req.params.id;
  const email = req.user.email;

  const borrowRecord = await borrowCollection.findOne({
    _id: new ObjectId(borrowId),
    borrowerEmail: email,
  });
  if (!borrowRecord) {
    return res.status(404).send({ message: "Borrow record not found!" });
  }

  const result = await borrowCollection.deleteOne({
    _id: new ObjectId(borrowId),
  });

  await booksCollection.updateOne(
    { _id: new ObjectId(borrowRecord.bookId) },
    { $inc: { availableCopies: 1 } },
  );

  res.send({ message: "Book returned successfully!", result });
});

//http://localhost:8000
app.get("/", (req, res) => {
  res.send({ message: "Server is runnig" });
});

app.listen(PORT, () => {
  console.log(`Server is runnig at ${PORT}`);
});
