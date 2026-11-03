# 📚 Book Nook Server

The robust backend RESTful API powering **Book Nook**, a modern digital library and book management platform. It handles book cataloging, user inventory management, JWT-based remote JWKS authentication, and an automated book borrowing/returning system.

🔗 **Client Repository:** [https://github.com/rohanislambd/book-nook-client](https://github.com/rohanislambd/book-nook-client)

---

## 🌟 Key Features & Logic

- **🔐 Remote JWKS Authentication:**
  - Secures protected routes using the `jose` library to verify JWT tokens against a remote JSON Web Key Set (`JWKS`) endpoint exposed by the client auth provider (`/api/auth/jwks`).
  - Ensures data integrity and attaches verified user payload (`req.user`) to protected endpoints.

- **📖 Complete Book Lifecycle Management:**
  - **Create & Read:** Add new books, browse all books, or query curated recent books for the homepage.
  - **Ownership & Authorization:** Users can only view, update, or delete books they personally created.
  - **Dynamic Inventory Calculation:** When updating copies, the server accurately recalculates total copies by accounting for currently borrowed copies (`newTotal = newAvailable + (oldTotal - oldAvailable)`).

- **🔄 Intelligent Borrow & Return System:**
  - **Duplicate Prevention:** Prevents a user from borrowing the same book more than once simultaneously.
  - **Real-Time Stock Updates:** Automatically decrements `availableCopies` when a book is borrowed.
  - **Manual Return:** Users can return borrowed books, which removes the record and automatically increments `availableCopies` back into inventory.
  - **Automated Expiry Handling:** Includes a built-in automated check (`autoReturnExpiredBooks`) that checks for past-due return dates (`returnDate < today`), cleans up expired borrow entries, and restores book stock.

---

## 🛠️ Tech Stack & Dependencies

| Technology | Purpose |
| :--- | :--- |
| **Node.js (ESM)** | JavaScript runtime environment (ECMAScript Modules) |
| **Express.js v5** | Fast, modern web framework for building REST APIs |
| **MongoDB Native Driver** | Official high-performance driver for MongoDB database |
| **jose** | Remote JWKS token verification and cryptographic operations |
| **CORS** | Cross-Origin Resource Sharing middleware |
| **dotenv** | Environment variable management |
| **Vercel** | Serverless deployment support via `@vercel/node` |

---

## 📡 API Endpoints Overview

### 1. General & Health Check
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | No | Server health check; returns running status. |

---

### 2. Books Management
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/books` | No | Get all books sorted by newest (`createdAt: -1`). |
| `GET` | `/bookshome` | No | Get the 6 latest books for homepage showcase. |
| `GET` | `/books/:id` | Yes | Get detailed information for a single book. |
| `GET` | `/my-book` | Yes | Retrieve books created by the authenticated user (`req.user.email`). |
| `POST` | `/books` | Yes | Add a new book to the library. |
| `PATCH` | `/books/:id` | Yes | Update book info and available copies (owner only). |
| `DELETE` | `/books/:id` | Yes | Delete a book (owner only). |

---

### 3. Borrowing & Returns
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/borrows` | Yes | Retrieve all books borrowed by the user (runs auto-return for expired books). |
| `GET` | `/borrows/check?bookId=:id` | Yes | Checks if the user has already borrowed a specific book. |
| `POST` | `/borrows` | Yes | Borrow a book (validates duplicate borrow & available stock; decrements inventory). |
| `DELETE` | `/borrows/:id` | Yes | Return a borrowed book (restores inventory count). |

---

## 🗄️ Database Collections

The database `book-nook` contains two primary collections:

### 1. `books` Collection
```json
{
  "_id": "ObjectId(...)",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Technology",
  "coverImage": "https://example.com/image.jpg",
  "description": "A handbook of agile software craftsmanship.",
  "availableCopies": 5,
  "totalCopies": 8,
  "userEmail": "user@example.com",
  "createdAt": "2026-11-01T12:00:00Z"
}
```

### 2. `borrows` Collection
```json
{
  "_id": "ObjectId(...)",
  "bookId": "654321abcdef...",
  "bookTitle": "Clean Code",
  "borrowerEmail": "reader@example.com",
  "borrowDate": "2026-11-01",
  "returnDate": "2026-11-15"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following keys:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
```

- `PORT`: Port on which the Express server listens (default: `8000`).
- `MONGODB_URI`: MongoDB connection URI (e.g., MongoDB Atlas or local instance).
- `CLIENT_URL`: URL of the frontend application where the JWKS keys are served (used for verifying JWTs at `${CLIENT_URL}/api/auth/jwks`).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (Local or MongoDB Atlas)
- npm or yarn

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rohanislambd/book-nook-server.git
   cd book-nook-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file as described in the [Environment Variables](#️-environment-variables) section.

4. **Start the server:**
   ```bash
   npm start
   ```
   Or directly with Node:
   ```bash
   node index.js
   ```
   Or with nodemon for development:
   ```bash
   npx nodemon index.js
   ```

5. The server will run at:
   ```
   http://localhost:8000
   ```

---

## ☁️ Deployment

This project is pre-configured for **Vercel** serverless deployment with [`vercel.json`](./vercel.json):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "source": "/(.*)",
      "destination": "index.js"
    }
  ]
}
```

When deploying on Vercel:
1. Import the repository into your Vercel Dashboard.
2. Set the Environment Variables (`MONGODB_URI`, `CLIENT_URL`) in Vercel project settings.
3. Deploy!

---

## 🤝 Connected Client

This backend works seamlessly with the **Book Nook Client** application:
- 💻 **Frontend Repository:** [https://github.com/rohanislambd/book-nook-client](https://github.com/rohanislambd/book-nook-client)
