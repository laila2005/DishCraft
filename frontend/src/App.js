import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [errorIngredients, setErrorIngredients] = useState(null);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  // State for user preferences
  const [selectedDietary, setSelectedDietary] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedProtein, setSelectedProtein] = useState('');

  // IMPORTANT: Replace with your actual Render backend URL
  const BACKEND_URL = 'https://dishcraft-backend-3tk2.onrender.com'; 

  // Fetch ingredients on component mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ingredients`);
        setIngredients(response.data);
        setLoadingIngredients(false);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setErrorIngredients('Failed to load ingredients. Please check your backend URL and CORS settings.');
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, []);

  // Function to generate a recipe based on preferences
  const generateRecipe = async () => {
    setLoadingRecipe(true);
    setErrorRecipe(null);
    setGeneratedRecipe(null); // Clear previous recipe

    const preferences = {
      dietary: selectedDietary,
      cuisine: selectedCuisine,
      protein: selectedProtein, // Example: pass selected protein
      // Add more preferences as you implement them
    };

    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-recipe`, { preferences });
      setGeneratedRecipe(response.data);
      setLoadingRecipe(false);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setErrorRecipe('Failed to generate recipe. Please try again.');
      setLoadingRecipe(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>DishCraft</h1>
        <p>Smart Recipe Generator & Meal Planner</p>
      </header>

      <main>
        {/* Ingredients Section */}
        <section className="ingredients-section">
          <h2>Available Ingredients:</h2>
          {loadingIngredients ? (
            <p>Loading ingredients...</p>
          ) : errorIngredients ? (
            <p className="error-message">Error: {errorIngredients}</p>
          ) : ingredients.length === 0 ? (
            <p>No ingredients found. Please seed your database.</p>
          ) : (
            <ul className="ingredient-list">
              {ingredients.map((ingredient) => (
                <li key={ingredient._id}>{ingredient.name}</li>
              ))}
            </ul>
          )}
        </section>

        <hr />

        {/* Recipe Generation Section */}
        <section className="recipe-generation-section">
          <h2>Generate a New Recipe</h2>
          <div className="preferences-input">
            <label htmlFor="dietary-select">Dietary Preference:</label>
            <select
              id="dietary-select"
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
            >
              <option value="">Any</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-Free</option>
              {/* Add more dietary options as needed */}
            </select>

            <label htmlFor="cuisine-select">Cuisine Type:</label>
            <select
              id="cuisine-select"
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
            >
              <option value="">Any</option>
              <option value="italian">Italian</option>
              <option value="mexican">Mexican</option>
              <option value="asian">Asian</option>
              <option value="american">American</option>
              {/* Add more cuisine options as needed */}
            </select>

            {/* Example: Select a protein (can be dynamically loaded from ingredients) */}
            <label htmlFor="protein-select">Main Protein:</label>
            <select
              id="protein-select"
              value={selectedProtein}
              onChange={(e) => setSelectedProtein(e.target.value)}
            >
              <option value="">Any</option>
              {ingredients.filter(ing => ing.category === 'protein').map(ing => (
                <option key={ing._id} value={ing.name.toLowerCase()}>{ing.name}</option>
              ))}
            </select>
          </div>

          <button onClick={generateRecipe} disabled={loadingRecipe}>
            {loadingRecipe ? 'Generating...' : 'Generate Recipe'}
          </button>

          {loadingRecipe && <p>Generating your delicious recipe...</p>}
          {errorRecipe && <p className="error-message">Error: {errorRecipe}</p>}

          {generatedRecipe && (
            <div className="generated-recipe-card">
              <h3>{generatedRecipe.title}</h3>
              <p>{generatedRecipe.description}</p>
              <h4>Components:</h4>
              <ul>
                <li><strong>Protein:</strong> {generatedRecipe.components.protein}</li>
                <li><strong>Vegetable:</strong> {generatedRecipe.components.vegetable}</li>
                <li><strong>Carb:</strong> {generatedRecipe.components.carb}</li>
                <li><strong>Sauce:</strong> {generatedRecipe.components.sauce}</li>
                <li><strong>Cooking Method:</strong> {generatedRecipe.components.cookingMethod}</li>
              </ul>
              <h4>Instructions:</h4>
              <ol>
                {generatedRecipe.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              <p><strong>Cooking Time:</strong> {generatedRecipe.cookingTime}</p>
              <p><strong>Difficulty:</strong> {generatedRecipe.difficulty}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
