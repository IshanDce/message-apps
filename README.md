Real-Time Messaging Application
This project is a feature-rich, real-time messaging application built with a modern tech stack. Designed to be a scalable and user-friendly communication platform, it offers a seamless experience across all devices, including mobile, tablet, and desktop, thanks to its fully responsive design.

Features
Key User Features:
Secure Authentication: Users can sign up and log in securely with email and password. Custom nicknames and profile pictures are supported.

Create Chat Spaces: Users can request the creation of new chat "Spaces" which are then approved by an admin.

Real-Time Messaging: Instantaneous text messaging with support for image and video sharing.

Invitation System: Space owners can invite other registered users to join their spaces. Invitees receive a notification and can accept or decline.

Interactive UI: Includes features like viewing space members, a full-screen media viewer for images and videos, and real-time notifications for new invites.

Fully Responsive: The UI is optimized for a seamless experience on mobile, tablet, and desktop devices.

Admin Panel:
The application includes a comprehensive, secure admin dashboard with a separate dark-mode UI. Admins have the authority to:

Approve Space Requests: View and approve or deny new space creation requests from users.

Manage Users: View a list of all registered users and delete their data from the database.

Oversee Spaces: Monitor all chat spaces, view conversations in a read-only mode, and delete entire spaces if necessary.

Tech Stack
Frontend: React (with Vite)

Backend & Database: Firebase (Firestore, Firebase Authentication)

Media Storage & Delivery: Cloudinary

Styling: Tailwind CSS

HTTP Client: Axios

Setup and Installation
Follow these steps to get the project running on your local machine.

1. Prerequisites
Make sure you have Node.js and npm installed on your system.

2. Clone the Repository
git clone <your-repository-url>
cd <repository-folder>

3. Install Dependencies
Install the required npm packages:

npm install

This will install firebase, axios, and other necessary React dependencies.

4. Configuration
You need to add your own API keys and configuration details in src/App.jsx.

Firebase: Create a new project on the Firebase Console. Create a new web app and find your firebaseConfig object in the project settings. Replace the placeholder in the code:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ...and so on
};

Cloudinary: Create a free account on Cloudinary. Find your Cloud Name on the dashboard. Then, go to Settings -> Upload -> Upload Presets, create a new preset with Signing Mode set to Unsigned, and copy its name.

const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET";

Admin Email: Set the email address for the admin account.

const ADMIN_EMAIL = "your-admin-email@example.com";

Firestore Security Rules: Ensure you have configured the appropriate security rules in your Firebase project to allow read/write access to the necessary collections.

5. Run the Application
Once the installation and configuration are complete, run the following command to start the development server:

npm run dev
