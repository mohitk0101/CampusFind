- 🌐 **Live Demo:** [CampusFind](https://campus-find-livid.vercel.app/)
  
##  Demo Credentials

CampusFind is designed specifically for NIT Kurukshetra students, so registration is restricted to valid college email addresses.
For users who don't have an NIT KKR email, a demo account is provided to explore the application:

- **Email:** `demo@nitkkr.ac.in`
- **Password:** `demo123`

# CampusFind
Lost and found portal for NIT Kurukshetra. Students can report lost or found items, verify ownership through custom questions, chat with other users, and manage active listings.

## Features

1. **Student Authentication:** You can sign up and log in securely using your official college email.
2. **Item Reporting:** Report lost or found items quickly by filling out a form with details, locations, and photos.
3. **Search and Filtering:** Browse active listings easily and filter them by category, dates, type, or simple search keywords.
4. **Internal Messaging:** Chat directly and securely with other students inside the app to arrange returns.
5. **Verification Questionnaires:** Answer custom ownership questions to safely confirm who the item belongs to.
6. **Exchange Resolution:** Both the finder and the owner confirm the exchange to mark the item as resolved.
7. **Admin Moderation:** Admins review incoming posts to approve them, request revisions, or track database statistics.
8. **Dark Theme:** Easily toggle between light and dark modes to match your visual preference.

## Project Structure

```text
CampusFind/
├── backend/
│   ├── middleware/
│   │   └── auth.js                 # JWT verification middleware
│   ├── models/
│   │   ├── Message.js              # Message schema
│   │   ├── Notification.js         # Notification schema
│   │   ├── Post.js                 # Item post schema
│   │   └── User.js                 # Student schema
│   ├── routes/
│   │   ├── admin.js                # Moderation and database metrics
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── messages.js             # Chat and conversations
│   │   ├── notifications.js        # Notification management
│   │   └── posts.js                # Listing creation and resolution
│   ├── utils/
│   │   ├── archiveScheduler.js     # Post expiration task
│   │   └── sendEmail.js            # Verification mailer helper
│   ├── seed.js                     # Seed script for mock data
│   └── server.js                   # Backend server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PostCard.jsx        # Grid item card component
│   │   │   ├── Sidebar.jsx         # Sidebar navigation links
│   │   │   └── Topbar.jsx          # Header search and actions
│   │   ├── context/
│   │   │   └── AppContext.jsx      # Global React state and caching
│   │   ├── pages/
│   │   │   ├── Admin.jsx           # Moderator dashboard view
│   │   │   ├── Auth.jsx            # Sign-up and login forms
│   │   │   ├── Chat.jsx            # Dynamic messaging page
│   │   │   ├── CreatePost.jsx      # Item report form
│   │   │   ├── Dashboard.jsx       # Feed overview and statistics
│   │   │   ├── MyItems.jsx         # User listing manager
│   │   │   ├── PostDetail.jsx      # Item details and claim flow
│   │   │   └── Profile.jsx         # Student details card
│   │   ├── utils/
│   │   │   └── api.js              # API fetch client and canvas compression
│   │   ├── App.jsx                 # Routes management
│   │   ├── index.css               # CSS custom properties and resets
│   │   └── main.jsx                # React entry mounting
│   ├── index.html                  # HTML entry point
│   └── vite.config.js              # Vite configurations
├── package.json                    # Package scripts
└── README.md                       # Repository documentation
```

## Tech Stack

*   **Frontend:** React, React Router, Vite, CSS
*   **Backend:** Node.js, Express, MongoDB (Mongoose)
*   **Mailer:** Nodemailer

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB local server or Atlas connection URI

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mohitk0101/CampusFind.git
   cd CampusFind
   ```

2. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_nodemailer_email
   EMAIL_PASS=your_nodemailer_app_password
   FRONTEND_URL=http://localhost:5173
   ```

3. Install dependencies and run the development servers:
   ```bash
   npm run install-all
   npm run dev
   ```
