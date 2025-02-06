import React, { useState } from 'react';
import { getGaladrielResponse } from './getGaladrielResponse';

const GaladrielComponent = () => {
    const [response, setResponse] = useState(null);
    const [input, setInput] = useState("");

    const handleSubmit = async () => {

        if (!input.trim()) {
            alert("Please enter a message before sending.");
            return;
        }

        alert(`Input captured: ${input}`);

        try {
            const result = await getGaladrielResponse(input);
            setResponse(result);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{color: "black", backgroundColor: "white", border: "1px solid black"}}
            />
            <button onClick={handleSubmit}>Send</button>
            {response && (
                <div>
                    <p>Response: {response.choices[0].message.content}</p>
                    <p>Hash: {response.hash}</p>
                    <p>Signed Public Key: {response.public_key}</p>
                    <p>Signature: {response.signature}</p>
                    <p>Tx Hash: {response.tx_hash}</p>
                    <p>Attestation: {response.attestation}</p>
                </div>
            )}
        </div>
    );
};

export default GaladrielComponent;