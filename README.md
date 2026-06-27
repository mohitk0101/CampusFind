# 🔍 CampusFind – NIT Kurukshetra Lost & Found Platform

A secure, full-stack Lost & Found platform exclusively for students of **NIT Kurukshetra**.

---

## ✨ Features

- 🔐 **Verified access** – Only `@nitkkr.ac.in` emails allowed
- 📧 **Email verification** – with built-in Developer Mailbox for testing
- 📝 **Lost & Found posts** – with image upload, categories, and Q&A sections
- ✅ **Admin approval** – all posts require admin review before going live
- 💬 **Secure messaging** – chat between students about specific posts
- 🔔 **Smart notifications** – notified only for categories you care about
- 📊 **Admin dashboard** – stats, pending review queue, user management
- 🎨 **Premium dark UI** – glassmorphism, animations, fully responsive

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript |
| Images | Base64 encoding (stored in MongoDB) |

---

## 🚀 Getting Started

### Step 1 – Set up MongoDB

You need a MongoDB database. Choose one option:

#### Option A: MongoDB Atlas (Free Cloud – Recommended)
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account and a free **M0 cluster**
3. Go to **Database → Connect → Connect your application**
4. Copy the connection string (looks like `mongodb+srv://...`)
5. Edit `.env` and replace the `MONGO_URI` line with your string

#### Option B: Local MongoDB
1. Download MongoDB Community from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. The default URI `mongodb://localhost:27017/campusfind` in `.env` will work

---

### Step 2 – Configure Environment

Edit the `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=campusfind_super_secret_jwt_key_nitkkr_2024
JWT_EXPIRES_IN=7d
```

---

### Step 3 – Install Dependencies

```bash
npm install
```

---

### Step 4 – Seed the Database (Optional but Recommended)

This creates an admin account and 6 sample posts so you can explore the platform immediately:

```bash
npm run seed
```

**Seed creates these accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@nitkkr.ac.in` | `admin123` |
| Student 1 | `124102101@nitkkr.ac.in` | `student123` |
| Student 2 | `124102102@nitkkr.ac.in` | `student123` |
| Student 3 | `124102103@nitkkr.ac.in` | `student123` |

---

### Step 5 – Start the Server

```bash
npm run dev    # Development mode (auto-restart with nodemon)
# or
npm start      # Production mode
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📬 Developer Mailbox

Since there is no real SMTP server, email verification is simulated:

1. Register a new account on the Sign Up page
2. Click the **📬 Dev Mailbox** button (bottom-left corner of every page)
3. Click **✅ Verify Email** to activate your account
4. Go back and log in!

The verification link is also printed in the server console.

---

## 👤 User Roles

### Student
- Register with `@nitkkr.ac.in` email
- Report lost/found items with images
- Search and filter posts
- Chat with other students
- Receive category-based notifications

### Admin
- Login at `/auth.html` with admin credentials
- Review and approve/reject pending posts
- View platform statistics
- Manage users

> **Note:** Admin accounts are not created via signup. Use `npm run seed` or insert directly into the database.

---

## 📁 Project Structure

```
CampusFind/
├── server.js              # Main server entry point
├── seed.js                # Database seed script
├── .env                   # Environment configuration
├── package.json
├── models/
│   ├── User.js            # Student/Admin user model
│   ├── Post.js            # Lost/Found post model
│   ├── Message.js         # Chat message model
│   └── Notification.js    # Notification model
├── routes/
│   ├── auth.js            # Registration, login, profile
│   ├── posts.js           # CRUD for posts + search/filter
│   ├── messages.js        # Messaging between students
│   ├── notifications.js   # User notifications
│   └── admin.js           # Admin moderation + stats
├── middleware/
│   └── auth.js            # JWT verification middleware
└── public/                # Frontend (static files)
    ├── index.html         # Landing page / Dashboard
    ├── auth.html          # Login & Signup
    ├── create-post.html   # Report Lost/Found item
    ├── post-detail.html   # Item detail + chat
    ├── chat.html          # Messages inbox
    ├── profile.html       # User profile + preferences
    ├── admin.html         # Admin dashboard
    ├── css/styles.css     # Premium design system
    └── js/
        ├── api.js         # API helpers + utilities
        └── app.js         # Core app + UI logic
```

---

## 🔒 Security Features

- ✅ Only `@nitkkr.ac.in` emails accepted
- ✅ Email verification before login
- ✅ Passwords hashed with bcrypt (12 salt rounds)
- ✅ JWT authentication on all protected routes
- ✅ Role-based access control (student / admin)
- ✅ Admin-only routes protected
- ✅ Post visibility only after admin approval
- ✅ Messaging restricted to approved posts only

---

## 📸 Categories

Wallet · ID Card · Electronics · Calculator · Laptop Charger · Books · Earbuds · Keys · Water Bottle · Bag · Watch · Clothes · Sports Equipment · Bicycle · Documents · Others

---

## 🔮 Future Enhancements (v2)

- Real-time chat with Socket.IO
- AI Image Matching
- Campus Map Integration
- Mobile Application
- Push Notifications
- Dark/Light mode toggle
- AI duplicate detection
