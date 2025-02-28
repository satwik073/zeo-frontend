import React, { useState } from "react";

const Chatbot = () => {
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askChatbot = async () => {
    if (!question.trim()) {
      alert("Please enter a question!");
      return;
    }

    try {
      const response = await fetch("https://zeo-chatbot-backend.vercel.app/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer || "Error getting response.");
    } catch (error) {
      console.error(error);
      setAnswer("Error getting response.");
    }
  };

  return (
    <div className="chatbot-container">
      <h1>ZEOTAP Chatbot</h1>
      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <br />
      <p className="response">{answer}</p>
      <button onClick={askChatbot}>Ask</button>
    </div>
  );
};

export default Chatbot;
