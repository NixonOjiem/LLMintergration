"use client"
import React from 'react'
import { useState } from 'react';
import { FormEvent } from 'react';


function QueryComponent() {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [service, setService] = useState('deepseek');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, service }),
            });

            const data = await response.json();
            setAnswer(data.answer || data.error);
        } catch (error) {
            setAnswer('Error connecting to server');
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <h1>LLM Query Interface</h1>
            <form onSubmit={handleSubmit}>
                <select value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini</option>
                    <option value="copilot">Copilot</option>
                </select>

                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your query"
                    rows={5}
                />

                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </form>

            {answer && (
                <div className="answer">
                    <h2>Response:</h2>
                    <p>{answer}</p>
                </div>
            )}

        </div>
    );
}

export default QueryComponent