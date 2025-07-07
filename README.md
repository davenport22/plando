# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Connecting to Firebase

Every Firebase project is also a Google Cloud project. They share the same underlying resources, and you can confirm this by matching the **Project ID** between the two consoles. To use backend features like creating trips and managing user profiles, you need to connect the application to your Firebase project by providing a service account.

### 1. Find your Project ID

- Go to the [Firebase Console](https://console.firebase.google.com/).
- Select your project.
- Click the gear icon next to "Project Overview" and select **Project settings**.
- Under the **General** tab, find and copy your **Project ID**. You can use this ID to find the same project in the [Google Cloud Console](https://console.cloud.google.com/) to confirm they are linked and to manage advanced services like enabling APIs.

### 2. Generate a Private Key

- In **Project settings**, go to the **Service accounts** tab.
- Click the **Generate new private key** button.
- A JSON file containing your credentials will be downloaded. Keep this file secure.

### 3. Enable and Configure Firebase Storage

For features like user profile picture uploads, you must enable and configure Firebase Storage.

- In the Firebase Console, go to the **Storage** section in the left-hand menu.
- Click **Get started** and follow the on-screen prompts to set up your storage bucket.
- **IMPORTANT:** When prompted, select the same location for your Storage bucket that you chose for your Firestore database. A mismatch in regions can cause errors. If you're unsure, your App Hosting backend is set to `europe-west1`, which is a good choice for both services.
- You can use the default security rules for development.
- Once created, your bucket will have a URL like `gs://your-project-id.appspot.com`. The part `your-project-id.appspot.com` is your **Storage Bucket** name.

### 4. Update your `.env` file

- Open the downloaded JSON file from step 2. You will find:
  - `client_email`: Your Firebase Client Email.
  - `private_key`: Your Firebase Private Key.
- Open the `.env` file at the root of this project.
- Add the credentials you collected. **It is crucial to wrap the entire private key in double quotes (`"`)**, including the `-----BEGIN...` and `-----END...` lines, as shown below. Also add your Storage Bucket name from step 3.

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account-email@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_KEY_CONTENT_WITH_ALL_ITS_NEWLINES
...
-----END PRIVATE KEY-----
"

# Add this line for file uploads
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
```

After you save the `.env` file, the development server will restart and should connect to your Firebase project successfully.
