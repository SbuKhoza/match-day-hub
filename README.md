# Match Day Hub

Create a modern football fantasy web application.

Tech Stack
- React
- TypeScript
- Vite
- TailwindCSS
- State Management
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Do NOT use Lovable Cloud or Lovable Database.
- Everything must use Firebase.

Use this Firebase configuration:

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "@secret:GOOGLE_API_KEY ",
  authDomain: "boltapp-b2dda.firebaseapp.com",
  projectId: "boltapp-b2dda",
  storageBucket: "boltapp-b2dda.firebasestorage.app",
  messagingSenderId: "176903704546",
  appId: "1:176903704546:web:aea9172d360795d69833bb"
};

Initialize Firebase correctly.

Use Firestore for all data.

Create a clean project architecture suitable for later migration to React Native.

Folder structure should separate:

- components
- screens
- hooks
- services
- firebase
- types
- utils
- contexts

The application must support:

- Light Theme
- Dark Theme

Primary colors:

- Black
- White
- Grey accents

Design requirements:

Modern football application

Large cards

Rounded corners

Soft shadows

Minimal UI

Responsive for desktop and mobile browsers.

Create the following pages:

Home

Fantasy

Match Center

News

Videos

Profile

Authentication

Create a bottom navigation for mobile and sidebar for desktop.

Do not implement functionality yet.

Only create the layout and navigation.


Implement Firebase Authentication.

Support:

Email & Password Sign Up

Login

Forgot Password

Logout

After registration, start an onboarding flow.

Step 1

Choose favourite football team.

Display teams in cards with logo and name.

Save favourite team in Firestore.

users

uid

name

email

favoriteTeam

createdAt

theme

After onboarding, navigate to Home.

Create reusable authentication components.

Persist login state.


Build the Home dashboard.

The dashboard should be personalized using the user's favourite team.

The first card should display:

Favourite Team Logo

Current League Position

Previous Match Result

Next Match

If the match is live, display:

LIVE badge

Current Score

Match Minute

Below this card create:

Latest News section

Show only 5 articles.

Each card displays:

Image

Headline

Short description

View All button.

Create Videos section.

Display 3 highlight videos in a horizontal carousel.

Each card displays:

Thumbnail

Title

Duration

View All button.

Everything must be responsive.

Do not implement APIs yet.

Create reusable components ready for API integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f61f14d-4947-4500-84df-dbf097cf8f25).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
