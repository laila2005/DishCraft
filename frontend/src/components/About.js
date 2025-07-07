import React from 'react';
import './About.css';

const About = () => (
    <div className="about-page">
        <div className="about-card">
            <h1 className="about-title">About DishCraft</h1>
            <p className="about-body">
                <span role="img" aria-label="plate" style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>🍽️</span> <strong>The Story Behind DishCraft</strong><br />
                DishCraft began with a simple yet relatable problem: not knowing what to cook with the ingredients you already have. We've all faced that moment—opening the fridge or pantry, only to feel stuck and uninspired.<br /><br />
                Our team recognized this common challenge and set out to build a solution that combines smart technology with intuitive design. The goal? To help users turn everyday ingredients into delicious, practical meals without the stress.<br /><br />
                DishCraft isn't just another recipe app. It's a platform that empowers you to discover new recipes, experiment with flavors, and make the most of what you have at home. Whether you're a seasoned chef or a curious beginner, DishCraft is here to spark your culinary creativity and help you craft your own dish, every day.<br /><br />
                Our mission is to make cooking accessible, fun, and personalized for everyone. We believe that every meal can be a moment of inspiration, and every cook can be a creator.
            </p>
            <h2 className="about-creators-title">Meet the Creators</h2>
            <ul className="about-creators-list">
                <li><strong>Laila Mohamed</strong> &mdash; <a href="mailto:laila.mf2005@gmail.com">laila.mf2005@gmail.com</a></li>
                <li><strong>Yusuf Abu Egila</strong> &mdash; <a href="mailto:yusufabuegila@gmail.com">yusufabuegila@gmail.com</a></li>
                <li><strong>Madonna Medhat</strong> &mdash; <a href="mailto:Madonna.medhat@icloud.com">Madonna.medhat@icloud.com</a></li>
            </ul>
            <p className="about-footer">
                Thank you for being part of our story. Happy cooking!<br />
                &mdash; The DishCraft Team
            </p>
        </div>
    </div>
);

export default About; 