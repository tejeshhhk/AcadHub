# AcadHub 📚

AcadHub is a modern, full-stack Academic Resource Sharing Platform designed to help students and educators discover, upload, and discuss educational materials. It features AI-powered automated summaries, robust file management, and an interactive community-driven ecosystem.

## ✨ Features

- **User Authentication:** Secure signup/login using JWT and bcrypt.
- **Resource Management:** Upload PDFs, documents, images, and videos seamlessly. 
- **Cloud Storage:** Integrated with Cloudinary for fast and reliable file delivery/downloads.
- **✨ AI Summaries:** Automatically generates intelligent summaries of uploaded resources using Groq AI.
- **Community Engagement:** Rate, review, and comment on study materials.
- **Personal Dashboard:** Track your study history, bookmarked items, and view overall statistics for items you've uploaded.
- **Trending & Discovery:** Algorithmically surfaces trending resources based on recent views and engagement scores.

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (No heavy frameworks, highly optimized!)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **AI Integration:** Groq SDK (Llama models) for resource summarization.
- **File Storage:** Cloudinary (Handling file arrays and streams directly from memory)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine. You will also need API keys for Cloudinary and Groq.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tejeshhhk/AcadHub.git
   cd AcadHub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `server/` directory and configure the following variables:
   ```env
   # Storage & Database
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001

   # Security
   JWT_SECRET=super_secret_jwt_key
   JWT_EXPIRE=30d

   # Cloudinary config (For file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # AI Integration
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Start the Application**
   ```bash
   # Start the Node logic
   npm start
   
   # Or run in development mode
   npm run dev
   ```

5. **Visit the App**
   Open your browser and navigate to: `http://localhost:5001`

## 📂 Project Structure

```text
├── public/                 # Frontend Interface
│   ├── css/                # Styling and animations
│   ├── js/                 # Client-side JS logic
│   └── *.html              # User Interface pages
├── server/                 # Backend Node.js Environment
│   ├── config/             # DB & Cloudinary Configuration
│   ├── controllers/        # Route logic & AI invocation
│   ├── middleware/         # Auth, Upload, and Rate Limiting
│   ├── models/             # Mongoose Schemas (User, Resource, Comment, Report)
│   ├── routes/             # Express API Endpoints
│   ├── services/           # External Services (Groq AI)
│   └── server.js           # Server application entry point
├── .gitignore
├── package.json
└── README.md
```

## 📜 License

This project is open-source and available under the MIT License.
