import React, { useState } from 'react';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 300 }}>
        {children}
        <button onClick={onClose} style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>
  );
}

export default function RecipeSuggestions({ recipes, onLike, onSave, onFeedback }) {
  const [selected, setSelected] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);

  const handleLike = (id) => onLike ? onLike(id) : alert(`Liked recipe ${id}`);
  const handleSave = (id) => onSave ? onSave(id) : alert(`Saved recipe ${id}`);
  const handleFeedback = (id) => {
    if (onFeedback) onFeedback(id, feedbackText, rating);
    else alert(`Feedback for ${id}: ${feedbackText} (Rating: ${rating})`);
    setFeedbackOpen(false);
    setFeedbackText('');
    setRating(5);
  };

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {recipes.map((recipe, idx) => (
        <div
          key={recipe._id || idx}
          style={{
            border: selected === idx ? '3px solid #007bff' : '1px solid #ccc',
            borderRadius: 8,
            padding: 16,
            background: selected === idx ? '#eaf4ff' : '#fff',
            minWidth: 250,
            boxShadow: selected === idx ? '0 0 8px #007bff55' : '0 0 4px #ccc',
            flex: '1 1 300px',
            marginBottom: 24
          }}
        >
          <h3>{recipe.name}</h3>
          {recipe.image && <img src={recipe.image} alt={recipe.name} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6 }} />}
          <p>{recipe.description}</p>
          <ul>
            {recipe.ingredients && recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing.name} {ing.quantity} {ing.unit}</li>
            ))}
          </ul>
          <button onClick={() => setSelected(idx)} style={{ marginBottom: 8 }}>
            {selected === idx ? 'Selected' : 'Select'}
          </button>
          <div>
            <button disabled={selected !== idx} onClick={() => handleLike(recipe._id)}>Like</button>
            <button disabled={selected !== idx} onClick={() => handleSave(recipe._id)}>Save</button>
            <button
              disabled={selected !== idx}
              onClick={() => setFeedbackOpen(true)}
            >
              Feedback
            </button>
          </div>
          {/* Feedback Modal */}
          <Modal open={feedbackOpen && selected === idx} onClose={() => setFeedbackOpen(false)}>
            <h4>Feedback for {recipe.name}</h4>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Your feedback"
              rows={4}
              style={{ width: '100%' }}
            />
            <div>
              <label>Rating: </label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={() => handleFeedback(recipe._id)}
              disabled={!feedbackText.trim()}
              style={{ marginTop: 8 }}
            >
              Submit Feedback
            </button>
          </Modal>
        </div>
      ))}
    </div>
  );
}
