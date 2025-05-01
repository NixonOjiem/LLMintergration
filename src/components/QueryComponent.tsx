"use client"
import React from 'react'
import { useState } from 'react';
import { FormEvent } from 'react';


function QueryComponent() {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [service, setService] = useState('gemini');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, service }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details?.error?.message || 'Request failed');
            }

            setAnswer(data.answer);
        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error instanceof Error ?
                error.message.replace(/\\n/g, '\n') : // Handle newlines in error messages
                'Unknown error occurred';
            setAnswer(`Error: ${errorMessage}`);
        }
        setLoading(false);
    };


    return (
        <div className="container">
            {/* <h1>LLM Query Interface</h1> */}
            <form onSubmit={handleSubmit}>
                <select value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="deepseek">DeepSeek</option>
                    {/* <option value="gemini">Gemini</option> */}
                    {/* <option value="copilot">Copilot</option> */}
                </select >

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