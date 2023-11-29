import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const handleGreeting = (input) => {
    const greetings = ['hello', 'hi', 'namaste', 'hey'];
    return greetings.some((greeting) => input.toLowerCase().includes(greeting));
  };

  const handleFileUpload = (files) => {
    setPdfFile(files[0]);
  };

  const chat = async (e, userMessage) => {
    e.preventDefault();

    if (!userMessage) return;
    setIsTyping(true);

    try {
      const updatedChats = [...chats, { role: 'user', content: userMessage }];
      setChats(updatedChats);

      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf', pdfFile);

        await fetch('http://localhost:3000/upload-pdf', {
          method: 'POST',
          body: formData,
        });
      }

      const response = await fetch('http://localhost:3000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chats: updatedChats,
          prompt: `User says: ${userMessage}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiResponse = data.output;

      const userMessageLowerCase = userMessage.toLowerCase();
      const isGreeting = handleGreeting(userMessageLowerCase);

      const prompt = isGreeting
        ? 'You are a helpful assistant. How can I assist you today?'
        : 'You are a helpful assistant.';

      setChats((prevChats) => [
        ...prevChats,
        { role: 'ai', content: aiResponse },
      ]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error processing request:', error);
      setIsTyping(false);
    } finally {
      setMessage('');
    }
  };

  return (
    <main>
      <h1>ChatGPT-AI Project</h1>

      <section ref={chatContainerRef} className="chat-container">
        {chats.map((chat, index) => (
          <p key={index} className={`message ${chat.role}`}>
            <span>
              <b>{chat.role.toUpperCase()}</b>
            </span>
            <span>:</span>
            <span>{chat.content}</span>
          </p>
        ))}
      </section>

      {isTyping && (
        <div className="loading-indicator">
          <p>
            <i>Typing...</i>
          </p>
        </div>
      )}

      <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e.target.files)} />

      <form onSubmit={(e) => chat(e, message)}>
        <input
          type="text"
          name="message"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
        />
      </form>
    </main>
  );
}

export default App;
