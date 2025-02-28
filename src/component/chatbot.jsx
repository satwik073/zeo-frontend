import React, { useState, useRef, useEffect } from "react";
import ConfirmationDialog from "./Modal";

const Chatbot = () => {
  // Load data from localStorage on initial render
  const loadFromLocalStorage = (key, defaultValue) => {
    try {
      const storedData = localStorage.getItem(key);
      return storedData ? JSON.parse(storedData) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };


  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState(() =>
    loadFromLocalStorage("chats", [{ id: 1, name: "New Chat", selected: true }]));
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatName, setEditingChatName] = useState("");
  const [model, setModel] = useState(() => loadFromLocalStorage("model", "GPT-4"));
  const [expandedMessages, setExpandedMessages] = useState(() =>
    loadFromLocalStorage("expandedMessages", {}));
  const [showSidebar, setShowSidebar] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);



  useEffect(() => {
    localStorage.setItem("model", model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem("expandedMessages", JSON.stringify(expandedMessages));
  }, [expandedMessages]);

  // Apply dark theme to document
  useEffect(() => {
    document.documentElement.className = "dark";
    document.body.className = "bg-zinc-900";
  }, []);

  // Scroll to bottom of messages when new message is added


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const askChatbot = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("https://zeo-chatbot-backend.vercel.app/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputValue,
          model: model,
          history: messages
        }),
      });

      const data = await response.json();

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: data.answer || "Error getting response.",
            timestamp: new Date().toISOString(),
            model: model
          }
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "Error getting response. Please try again later.",
            timestamp: new Date().toISOString(),
            model: model
          }
        ]);
        setIsLoading(false);
      }, 500);
    }
  };

  const selectedChatId = chats.find(chat => chat.selected)?.id || 1;
  // State management with localStorage persistence
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askChatbot();
    }
  };

  const createNewChat = () => {
    // Save current chat's messages to localStorage
    localStorage.setItem(`chatMessages_${selectedChatId}`, JSON.stringify(messages));
  
    const newChatId = chats.length > 0 ? Math.max(...chats.map((c) => c.id)) + 1 : 1;
  
    setChats((prevChats) => [
      ...prevChats.map((chat) => ({ ...chat, selected: false })),
      { id: newChatId, name: "New Chat", selected: true },
    ]);
  
    // Reset messages for the new chat
    setMessages([]);
  };


  const selectChat = (id) => {
    // Save current chat's messages to localStorage
    localStorage.setItem(`chatMessages_${selectedChatId}`, JSON.stringify(messages));
  
    // Update the selected chat
    setChats((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        selected: chat.id === id,
      }))
    );
  
    // Load the new chat's messages from localStorage
    const chatMessages = loadFromLocalStorage(`chatMessages_${id}`, []);
    setMessages(chatMessages);
  };
  useEffect(() => {
    const chatMessages = loadFromLocalStorage(`chatMessages_${selectedChatId}`, []);
    setMessages(chatMessages);
  }, [selectedChatId]);
  const startRenamingChat = (id, currentName, e) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditingChatName(currentName);
  };

  const saveRenamedChat = () => {
    if (editingChatName.trim()) {
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === editingChatId
            ? { ...chat, name: editingChatName }
            : chat
        )
      );
    }
    setEditingChatId(null);
    setEditingChatName("");
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      saveRenamedChat();
    } else if (e.key === "Escape") {
      setEditingChatId(null);
      setEditingChatName("");
    }
  };



  const [messages, setMessages] = useState(() =>
    loadFromLocalStorage(`chatMessages_${selectedChatId}`, []))

  // Load messages for the selected chat
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Save messages specific to the selected chat ID
  useEffect(() => {
    localStorage.setItem(`chatMessages_${selectedChatId}`, JSON.stringify(messages));
  }, [messages, selectedChatId]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // When selected chat changes, load the messages for that chat
  useEffect(() => {
    const chatMessages = loadFromLocalStorage(`chatMessages_${selectedChatId}`, []);
    setMessages(chatMessages);
  }, [selectedChatId]);

  // Update deleteChat function to also remove chat messages
  const deleteChat = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      // Remove the chat's messages from localStorage
      localStorage.removeItem(`chatMessages_${id}`);
  
      // Remove the chat from the chats array
      const newChats = chats.filter((c) => c.id !== id);
  
      // If we're deleting the selected chat, select another one
      if (chats.find((c) => c.id === id)?.selected && newChats.length > 0) {
        // Select the last chat in the list
        newChats[newChats.length - 1].selected = true;
      }
  
      setChats(newChats.length > 0 ? newChats : [{ id: 1, name: "New Chat", selected: true }]);
    }
  };

  // Update clearConversations to remove all chat messages
  const clearConversations = () => {
    // Remove all chat messages from localStorage
    chats.forEach((chat) => {
      localStorage.removeItem(`chatMessages_${chat.id}`);
    });
  
    setChats([{ id: 1, name: "New Chat", selected: true }]);
    setMessages([]);
  };

  const toggleMessageExpansion = (index) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show a subtle notification
        const notification = document.createElement('div');
        notification.textContent = 'Copied to clipboard';
        notification.className = 'fixed bottom-4 right-4 bg-zinc-700 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 z-50';
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0 hidden'} transition-all duration-300 bg-zinc-800/50 backdrop-blur-md flex flex-col border-r border-zinc-700/50 relative`}>
        <div className="p-4 border-b border-zinc-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-100">Conversations</h2>
            <button onClick={toggleSidebar} className="text-zinc-400 hover:text-zinc-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 transition-all duration-200 shadow-lg hover:shadow-indigo-600/20 font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-3 text-xs text-zinc-400 font-semibold uppercase tracking-wider">Recent Chats</div>
          <ul className="space-y-1 px-3">
            {chats.map(chat => (
              <li key={chat.id} className="mb-2">
                {editingChatId === chat.id ? (
                  <div className="flex items-center p-2 bg-zinc-700/50 rounded-lg">
                    <input
                      type="text"
                      value={editingChatName}
                      onChange={(e) => setEditingChatName(e.target.value)}
                      onBlur={saveRenamedChat}
                      onKeyDown={handleRenameKeyDown}
                      className="bg-zinc-700 text-zinc-100 p-2 rounded w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-zinc-600"
                      autoFocus
                      placeholder="Enter chat name..."
                    />
                    <button
                      className="ml-2 text-zinc-400 hover:text-indigo-400"
                      onClick={saveRenamedChat}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`group flex items-center justify-between p-1.5 px-4 rounded-lg cursor-pointer transition-all duration-200 ${chat.selected
                      ? "bg-gradient-to-r from-indigo-900/50 to-indigo-600/20 border border-indigo-500/30"
                      : "hover:bg-zinc-700/30 border border-transparent"
                      }`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <div className="flex items-center overflow-hidden">
                      <div className={`mr-3 text-lg ${chat.selected ? "text-indigo-400" : "text-zinc-500"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="truncate text-sm font-medium">{chat.name}</span>
                    </div>

                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startRenamingChat(chat.id, chat.name, e)}
                        className="p-1 rounded hover:bg-zinc-600 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Rename chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat.id); // Set the chat to delete
                          setIsConfirmationOpen(true); // Open the confirmation dialog
                        }}
                        className="p-1 rounded hover:bg-red-600/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      
        <div className="p-4 border-t border-zinc-700/50">
          <div
            className="flex items-center text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer p-3 rounded-md hover:bg-zinc-700/50 transition-colors mb-2"
            onClick={clearConversations}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Conversations
          </div>

          <div className="p-3 rounded-lg bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-zinc-300">Current Model</p>
                <p className="text-sm font-semibold text-indigo-400">{model}</p>
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              ZEOTAP AI provides intelligent responses powered by state-of-the-art language models.
            </div>
          </div>
        </div>
      </div>
      {isConfirmationOpen && (
                        <ConfirmationDialog
                          message="Are you sure you want to delete this chat?"
                          
                          onConfirm={() => {
                            // Delete the chat
                            setChats(prevChats => prevChats.filter(c => c.id !== chatToDelete));
                            setIsConfirmationOpen(false); // Close the dialog
                            setChatToDelete(null); // Reset the chat to delete
                          }}
                          onCancel={() => {
                            setIsConfirmationOpen(false); // Close the dialog
                            setChatToDelete(null); // Reset the chat to delete
                          }}
                        />
                      )}
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-zinc-800/30 backdrop-blur-md border-b border-zinc-700/50 py-3 px-4 flex items-center justify-between sticky top-0 z-10">
          {!showSidebar && (
            <button onClick={toggleSidebar} className="mr-3 text-zinc-400 hover:text-zinc-200 p-2 rounded-md hover:bg-zinc-700/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">ZEOTAP AI</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              {model}
            </div>

            <div className="hidden sm:flex items-center text-zinc-400 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 bg-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto py-8 px-6 rounded-2xl bg-zinc-800/20 backdrop-blur-sm border border-zinc-700/30">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-3">Welcome to ZEOTAP AI</h2>
                <p className="text-zinc-400 mb-6">
                  I'm your AI assistant for Zeotap products and services. Ask me anything or try one of the examples below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    "How do I set up a new source in Segment?",
                    "How can I create a user profile in mParticle?",
                    "How do I build an audience segment in Lytics?",
                    "How can I integrate my data with Zeotap?"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      className="bg-zinc-800/50 hover:bg-indigo-600/10 rounded-lg p-3 text-sm text-zinc-300 text-left border border-zinc-700/50 hover:border-indigo-500/40 transition-all duration-200 hover:shadow-lg"
                      onClick={() => setInputValue(suggestion)}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {suggestion}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl    mx-auto">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${message.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                      : "bg-zinc-800/60 backdrop-blur-sm text-zinc-100 border border-zinc-700/50"
                      }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2 pb-2 border-b border-zinc-700/30">
                        <div className="w-5 h-5 rounded-md bg-indigo-600/30 flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-indigo-300">ZEOTAP AI</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                      <div className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className={`text-xs ${message.role === "user" ? "text-white/70 hover:text-white" : "text-zinc-400 hover:text-zinc-200"} transition-colors focus:outline-none rounded-md p-1 hover:bg-white/10`}
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 shadow-lg">
                    <div className="flex items-center mb-2 pb-2 border-b border-zinc-700/30">
                      <div className="w-5 h-5 rounded-md bg-indigo-600/30 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-indigo-300">ZEOTAP AI</span>
                    </div>
                    <div className="flex space-x-2 items-center h-6 px-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center rounded-xl overflow-hidden bg-zinc-800/80 border border-zinc-700/50 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-200">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ZEOTAP AI..."
                className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none p-4 resize-none max-h-40 overflow-y-auto custom-scrollbar"
                rows={1}
              />
              <button
                onClick={askChatbot}
                disabled={isLoading || !inputValue.trim()}
                className={`p-4 ${isLoading || !inputValue.trim()
                  ? "text-zinc-500 cursor-not-allowed"
                  : "text-indigo-400 hover:text-indigo-300"
                  } transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;