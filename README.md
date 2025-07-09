# DishCraft: Craft Your Own Dish

## Project Overview
DishCraft is an innovative web application designed to simplify home cooking by providing personalized recipe suggestions based on available ingredients and dietary preferences. It aims to connect food enthusiasts with professional chefs, fostering a community around culinary creativity and shared knowledge.

## Features

### Core Features
*   **User Profiles:** Each user has a personalized profile, with distinct roles for normal users and chefs. Users can customize their profile pictures and manage their collection of saved recipes.
*   **Recipe Generation:** The application suggests meals based on ingredients users have on hand and their dietary preferences. It utilizes a sophisticated rule-based AI system to generate multiple recipe options when available, ensuring intelligent and relevant suggestions.
*   **Chef Capabilities:** Chefs have enhanced functionalities, including the ability to create and add detailed recipes. They can specify ingredients, instructions, preparation and cooking times, ingredient quantities, optional chef notes, and calorie information. A dedicated chef dashboard provides analytics such as average ratings, feedback, and the total number of recipes added.
*   **User Interaction with Recipes:** Users can engage with recipes by liking them, providing star ratings, submitting detailed feedback, and saving them to their personal collections.

### Future Enhancements
*   **Diet and Allergy Preferences:** Implement advanced filtering to generate recipes based on user-defined diets and specific allergies.
*   **E-commerce Integration:** Enable users to purchase missing ingredients or related products directly through the platform.
*   **Community Platform:** Develop a robust social platform to connect food lovers and chefs, facilitating recipe sharing, discussions, and collaborations.
*   **Application-Based System:** Expand DishCraft into a dedicated application that can be utilized by hotels or catering services for meal planning, feedback collection, and new recipe development.
*   **Advanced AI/ML:** Explore incorporating machine learning models to further enhance recipe generation intelligence and personalization.

## Technologies Used

### Frontend
*   **React.js:** A JavaScript library for building user interfaces.
*   **Axios:** Promise-based HTTP client for making API requests.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.

### Backend
*   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
*   **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
*   **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
*   **JSON Web Tokens (JWT):** For secure user authentication.

### Database
*   **MongoDB:** A NoSQL document database.
*   **MongoDB Atlas:** Cloud-hosted database service.

### Deployment
*   **Render:** For back-end deployment.
*   **Vercel** For front-end deployment.

## Getting Started

To get a copy of the project up and running on your local machine for development and testing purposes, follow these steps:

### Prerequisites
*   Node.js (v18.x or higher recommended)
*   npm (Node Package Manager)
*   MongoDB Atlas account (or a local MongoDB instance)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/laila2005/DishCraft.git
    cd DishCraft
    ```

2.  **Backend Setup:**
    Navigate to the `backend` directory and install dependencies:
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and add your MongoDB URI and JWT Secret:
    ```
    MONGO_URI=your_mongodb_connection_string_here
    JWT_SECRET=your_super_secret_jwt_key_here
    ```
    Replace `your_mongodb_connection_string_here` with your actual MongoDB Atlas connection string and `your_super_secret_jwt_key_here` with a strong, random string.

3.  **Frontend Setup:**
    Navigate to the `frontend` directory and install dependencies:
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    From the `backend` directory, run:
    ```bash
    node server.js
    ```
    You should see a message indicating the server is running on port 5000.

2.  **Start the Frontend Development Server:**
    From the `frontend` directory, run:
    ```bash
    npm start
    ```
    This will open the application in your browser (usually at `http://localhost:3000`).

## Development Report

### Successes
*   Successfully implemented secure user authentication (login/signup) with JWT.
*   Developed a dynamic recipe generation system based on user input and a rule-based AI.
*   Established robust user and chef profile management, including saved recipes and profile customization.
*   Integrated an interactive system for users to like, rate, and provide feedback on recipes.
*   Achieved a responsive and intuitive UI design, overcoming initial styling challenges.

### Challenges
*   **Authentication State Management:** Initial difficulties with handling authentication state and `BACKEND_URL` configuration.
*   **Persistent Frontend Caching:** Encountered persistent caching and build issues on the frontend, leading to incorrect HTTP request methods (GET vs. POST for signup).
*   **UI Styling Discrepancies:** Debugging unstyled UI due to mismatches between CSS class names in `App.js` and `App.css`.
*   **MongoDB Connection Errors:** Resolved issues related to MongoDB connection string configuration and authentication failures.
*   **Rule-Based AI Implementation:** The complexity of implementing a sophisticated rule-based AI for recipe generation required careful design and debugging.

### Lessons Learned
*   The critical importance of thorough dependency management (`npm install`) for both frontend and backend.
*   The necessity of correctly configuring environment variables (`.env`) for database connections and security.
*   Effective debugging strategies for identifying and resolving frontend-backend communication issues.
*   The value of strict adherence to CSS class naming conventions for consistent UI styling.
*   The benefits of an iterative development approach and persistent problem-solving in overcoming technical hurdles.

## Contributeurs
- Laila Mohamed <laila.mohamed.fikry@gmail.com>
- Yusuf Abu Egila <yusufabuegila@gmail.com>
- Madonna Medhat <Madonna.medhat@icloud.com>

## Contact
For any inquiries, please open an issue in the GitHub repository.
