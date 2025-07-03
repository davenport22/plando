# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Connecting to Firebase

To use backend features like creating trips and managing user profiles, you need to connect the application to your Firebase project. This requires a service account.

### 1. Find your Project ID

- Go to the [Firebase Console](https://console.firebase.google.com/).
- Select your project.
- Click the gear icon next to "Project Overview" and select **Project settings**.
- Under the **General** tab, find and copy your **Project ID**.

### 2. Generate a Private Key

- In **Project settings**, go to the **Service accounts** tab.
- Click the **Generate new private key** button.
- A JSON file containing your credentials will be downloaded. Keep this file secure.

### 3. Update your `.env` file

- Open the downloaded JSON file. You will find:
  - `client_email`: Your Firebase Client Email.
  - `private_key`: Your Firebase Private Key.
- Open the `.env` file at the root of this project.
- Add the credentials you collected, making sure to wrap the private key in double quotes:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account-email@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT...\n-----END PRIVATE KEY-----\n"
```

After you save the `.env` file, the development server will restart and should connect to your Firebase project successfully.
