import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userIngredients, setUserIngredients] = useState([]);

  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorRecipe, setErrorRecipe] = useState(null);

  const [recipeOptions, setRecipeOptions] = useState({
    cookingMethod: 'Stir-frying',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: '20-30 minutes'
  });

  const getBackendUrl = () => {
    return process.env.REACT_APP_BACKEND_URL || 'https://dishcraft-backend-3tk2.onrender.com';
  };

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${getBackendUrl()}/api/ingredients`);
        const data = response.data.data || response.data;
        if (Array.isArray(data)) {
          setIngredients(data);
        }
      } catch (err) {
        console.error('Failed to fetch ingredients:', err);
      }
    };

    fetchIngredients();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setIngredientInput(value);
    if (value.trim()) {
      const filtered = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredIngredients(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addIngredient = (name) => {
    if (name && !userIngredients.includes(name)) {
      setUserIngredients(prev => [...prev, name]);
      setIngredientInput('');
      setShowSuggestions(false);
    }
  };

  const removeIngredient = (name) => {
    setUserIngredients(prev => prev.filter(i => i !== name));
  };

  const generateRecipe = async () => {
    if (userIngredients.length === 0) {
      alert('Please add at least one ingredient.');
      return;
    }

    try {
      setLoadingRecipe(true);
      const response = await axios.post(`${getBackendUrl()}/api/generate-recipe`, {
        ingredients: userIngredients,
        ...recipeOptions
      });
      setGeneratedRecipe(response.data);
    } catch (err) {
      setErrorRecipe('Failed to generate recipe.');
    } finally {
      setLoadingRecipe(false);
    }
  };

  return (
    <div className="main-content">
      <h2>🧪 Generate Your Next Meal</h2>

      <div className="ingredient-input-section">
        <h3>Enter ingredients:</h3>
        <input
          type="text"
          value={ingredientInput}
          onChange={handleInputChange}
          placeholder="e.g., tomato"
        />
        <button onClick={() => addIngredient(ingredientInput)}>Add Ingredient</button>

        {showSuggestions && filteredIngredients.length > 0 && (
          <ul className="ingredient-suggestions">
            {filteredIngredients.slice(0, 5).map((ing, idx) => (
              <li key={idx} onClick={() => addIngredient(ing.name)}>
                {ing.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="selected-ingredients">
        <h4>Selected:</h4>
        {userIngredients.map((ing, idx) => (
          <span key={idx} className="ingredient-tag">
            {ing}
            <button onClick={() => removeIngredient(ing)}>×</button>
          </span>
        ))}
      </div>

      <button onClick={generateRecipe} disabled={loadingRecipe}>
        {loadingRecipe ? 'Generating...' : 'Generate Recipe'}
      </button>

      {errorRecipe && <p className="error">{errorRecipe}</p>}

      {generatedRecipe && (
        <div className="generated-recipe">
          <h3>{generatedRecipe.name}</h3>

          <div>
            <strong>Time:</strong> {generatedRecipe.prepTime}
            <br />
            <strong>Difficulty:</strong> {generatedRecipe.difficulty}
            <br />
            <strong>Cuisine:</strong> {generatedRecipe.cuisine}
          </div>

          <h4>Ingredients:</h4>
          <ul>
            {generatedRecipe.ingredients.map((i, idx) => (
              <li key={idx}>{i.quantity} {i.name}</li>
            ))}
          </ul>

          <h4>Instructions:</h4>
          <ol>
            {generatedRecipe.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default HomePage;
