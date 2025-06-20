import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // IMPORTANT: Replace with your actual Render backend URL
  const BACKEND_URL = 'https://dishcraft-backend-3tk2.onrender.com'; 

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ingredients`);
        setIngredients(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setError('Failed to load ingredients. Please check your backend URL and CORS settings.');
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  if (loading) {
    return <div className="App">Loading ingredients...</div>;
  }

  if (error) {
    return <div className="App error-message">Error: {error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>DishCraft Ingredients</h1>
      </header>
      <main>
        <h2>Available Ingredients:</h2>
        {ingredients.length === 0 ? (
          <p>No ingredients found. Please seed your database.</p>
        ) : (
          <ul className="ingredient-list">
            {ingredients.map((ingredient) => (
              <li key={ingredient._id}>{ingredient.name}</li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
