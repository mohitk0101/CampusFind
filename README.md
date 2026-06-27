# 🔍 CampusFind – NIT Kurukshetra Lost & Found Platform

A secure, full-stack Lost & Found platform exclusively for students of NIT Kurukshetra


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

 Security Features

-  Only `@nitkkr.ac.in` emails accepted
-  Email verification before login
-  Passwords hashed with bcrypt (12 salt rounds)
-  JWT authentication on all protected routes
-  Role-based access control (student / admin)
-  Admin-only routes protected
-  Post visibility only after admin approval
- Messaging restricted to approved posts only

Future Enhancements (v2)

- Real-time chat with Socket.IO
- AI Image Matching
- Campus Map Integration
- Mobile Application
- Push Notifications
- Dark/Light mode toggle
- AI duplicate detection
