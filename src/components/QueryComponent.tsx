"use client"
import React from 'react'
import { useState } from 'react';
import { FormEvent } from 'react';


function QueryComponent() {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [service, setService] = useState('gemini');
    const [loading, setLoading] = useState(false);

    // QueryComponent.tsx - Revised error handling
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('Submitting query:', query, 'to service:', service);
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, service }),
            });

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
            }

            if (!response.ok) {
                const errorMessage = data?.error || `Service unavailable (${response.status})`;
                const suggestions = data?.suggestion?.join('\n') || 'Please try again later';
                throw new Error(`${errorMessage}\nSuggestions:\n${suggestions}`);
            }

            setAnswer(data.answer);
        } catch (error) {
            let errorMessage = 'Service unavailable. Please try again later.';
            if (error instanceof Error) {
                errorMessage = error.message.replace(/\\n/g, '\n');
            }
            setAnswer(`Error: ${errorMessage}`);
        }
        setLoading(false);
    };


    return (
        <div className="container">
            {/* <h1>LLM Query Interface</h1> */}
            <form onSubmit={handleSubmit}>
                <select value={service} onChange={(e) => setService(e.target.value)}>
                    {/* <option value="deepseek">DeepSeek</option> */}
                    <option value="gemini">Gemini</option>
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