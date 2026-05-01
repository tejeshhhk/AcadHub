# AcadHub 📚

AcadHub is a modern, full-stack Academic Resource Sharing Platform designed to help students and educators discover, upload, and discuss educational materials. It features AI-powered automated summaries, robust file management, and an interactive community-driven ecosystem.

## ✨ Features

- **Email Verification:** Secure registration flow with 6-digit OTP verification powered by **Brevo API**.
- **User Authentication:** Secure signup/login using JWT, bcrypt, and password visibility toggles.
- **Resource Management:** Upload PDFs, documents, images, and videos seamlessly. 
- **Cloud Storage:** Integrated with Cloudinary for fast and reliable file delivery/downloads.
- **✨ AI Summaries:** Automatically generates intelligent summaries of uploaded resources using Groq AI (Llama 3).
- **Community Engagement:** Rate, review, and comment on study materials.
- **Personal Dashboard:** Track your study history, bookmarked items, and view overall statistics for items you've uploaded.
- **Trending & Discovery:** Algorithmically surfaces trending resources based on recent views and engagement scores.

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (Modern, responsive UI with Glassmorphism).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (Mongoose ORM).
- **Email Service:** Brevo (formerly Sendinblue) Transactional API.
- **AI Integration:** Groq SDK for lightning-fast resource summarization.
- **File Storage:** Cloudinary (Direct memory stream uploads).

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed. You will also need API keys for Cloudinary, Groq, and Brevo.

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
   Create a `.env` file in the `server/` directory:
   ```env
   # Server & Database
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret

   # AI Integration
   GROQ_API_KEY=your_groq_api_key

   # Cloudinary config
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email Configuration (Brevo)
   BREVO_API_KEY=your_brevo_api_key
   EMAIL_FROM=your_verified_sender_email
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

5. **Visit the App**
   Navigate to: `http://localhost:5001`

## 📂 Project Structure

```text
├── public/                 # Frontend Interface
│   ├── css/                # Styling and animations
│   ├── js/                 # Client-side logic (auth.js, app.js)
│   └── verify.html         # Email verification page
├── server/                 # Backend Node.js Environment
│   ├── controllers/        # Route logic (authController, resourceController)
│   ├── models/             # Mongoose Schemas (User, Resource, etc.)
│   ├── routes/             # Express API Endpoints
│   ├── services/           # External Services (aiService, emailService)
│   └── server.js           # Server entry point
└── README.md
```

## 📜 License

This project is open-source and available under the MIT License.
