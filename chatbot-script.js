// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Track misunderstood messages
let misunderstoodCount = 0;
let awaitingAgentResponse = false;

// Check if elements exist (for pages without chatbot)
if (chatMessages && userInput && sendButton) {

// AI API Configuration
// Replace with your actual API key and endpoint
const API_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE', // Add your API key here
    endpoint: 'https://api.openai.com/v1/chat/completions', // OpenAI API endpoint
    model: 'gpt-3.5-turbo' // or 'gpt-4' if you have access
};

// FAQ Database (fallback responses) - Customized for MK Beauty Salon
const faqDatabase = {
    'nail': 'We offer acrylic and gel nails in various shapes (Almond, Square, Coffin, Stiletto):\n- Acrylic Small: R130 | Medium: R170 | Long: R220\n- Gel Small: R90 | Medium: R140 | Large: R180',
    'acrylic': 'Acrylic nails:\n- Small: R130\n- Medium: R170\n- Long: R220\nAvailable in Almond, Square, Coffin, and Stiletto shapes.',
    'gel': 'Gel nails:\n- Small: R90\n- Medium: R140\n- Large: R180\nAvailable in Almond, Square, Coffin, and Stiletto shapes.',
    'lash': 'We offer cluster eyelashes for R150. Perfect for a dramatic, voluminous look!',
    'eyelash': 'We offer cluster eyelashes for R150. Perfect for a dramatic, voluminous look!',
    'install': 'Hair installation services:\n- Basic Installation: R180\n- Styled Installation: R230',
    'installation': 'Hair installation services:\n- Basic Installation: R180\n- Styled Installation: R230',
    'makeup': 'Makeup services:\n- Natural Makeup: R170\n- Full Glam Makeup: R220',
    'price': 'Our prices:\n- Acrylic: R130-R220\n- Gel: R90-R180\n- Eyelashes: R150\n- Installation: R180-R230\n- Makeup: R170-R220',
    'hours': 'Our salon hours are:\n- Monday to Friday: 9:00 AM - 6:00 PM\n- Saturday: 10:00 AM - 3:00 PM\n- Closed on Sundays',
    'open': 'We are open Monday to Friday from 9:00 AM to 6:00 PM, and Saturday from 10:00 AM to 3:00 PM. We are closed on Sundays.',
    'booking': 'To book an appointment, please call us at 066 100 7863 or use the booking form on our website. A R50 booking fee is required to secure your slot.',
    'book': 'To book an appointment, please call us at 066 100 7863 or use the booking form on our website. A R50 booking fee is required to secure your slot.',
    'contact': 'Contact MK Beauty Salon:\n- Phone: 066 100 7863\n- Email: mikhensomk388@gmail.com\n- Location: Vereeniging, Gauteng\n- WhatsApp: 066 100 7863',
    'location': 'We are located in Vereeniging, Gauteng. Contact us at 066 100 7863 for directions!',
    'review': 'We have a 4.9/5 star rating based on 127 reviews! Our clients love our services. You can view all reviews on our reviews page.',
    'default': 'I am Xberry, your MK Beauty Salon assistant! I can help you with information about our nail services, eyelashes, hair installations, makeup, prices, opening hours, and bookings. What would you like to know?'
};

// Agent/human keywords
const agentKeywords = ['agent', 'human', 'person', 'real person', 'speak to someone', 'talk to human', 'customer service', 'support', 'help me', 'representative'];

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add quick reply buttons
function addQuickReplies() {
    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'quick-replies';
    quickRepliesDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;';

    const questions = [
        'What are your prices?',
        'What are your hours?',
        'Tell me about nails',
        'How do I book?',
        'Contact info',
        'Open Gallery',
        'See Reviews'
    ];

    questions.forEach(question => {
        const button = document.createElement('button');
        button.className = 'quick-reply-btn';
        button.textContent = question;
        button.style.cssText = `
            background: linear-gradient(135deg, #ff69b4, #da70d6);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        button.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(255, 105, 180, 0.4)';
        };
        button.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };
        button.onclick = function() {
            userInput.value = question;
            handleUserMessage();
        };
        quickRepliesDiv.appendChild(button);
    });

    chatMessages.appendChild(quickRepliesDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Check FAQ database for matching response
function checkFAQ(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for agent/human keywords first
    for (const keyword of agentKeywords) {
        if (lowerMessage.includes(keyword)) {
            // Return special marker to trigger agent handoff
            return 'AGENT_HANDOFF_REQUESTED';
        }
    }
    
    for (const [keyword, response] of Object.entries(faqDatabase)) {
        if (keyword !== 'default' && lowerMessage.includes(keyword)) {
            return response;
        }
    }
    
    return faqDatabase.default;
}

// Call AI API for response
async function getAIResponse(userMessage) {
    // If no API key is configured, use FAQ database
    if (API_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        return checkFAQ(userMessage);
    }

    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are Xberry, a friendly customer service assistant for MK Beauty Salon in Vereeniging, Gauteng. Answer questions about nail services (acrylic and gel), eyelashes, hair installations, makeup, prices in Rands, and opening hours (Monday-Friday 9:00 AM - 6:00 PM). Be friendly, professional, and concise. The salon requires a R50 booking fee.'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to FAQ database if API fails
        return checkFAQ(userMessage);
    }
}

// Handle user message
async function handleUserMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Check if waiting for agent response
    if (awaitingAgentResponse) {
        if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('yeah') || message.toLowerCase().includes('sure')) {
            addMessage("Connecting you to our agent on WhatsApp...", false);
            setTimeout(() => {
                window.open('https://wa.me/27661007863', '_blank');
            }, 1000);
            awaitingAgentResponse = false;
            misunderstoodCount = 0;
        } else if (message.toLowerCase().includes('no') || message.toLowerCase().includes('nope')) {
            addMessage("No problem! How else can I help you today?", false);
            awaitingAgentResponse = false;
            misunderstoodCount = 0;
        } else {
            addMessage("Please respond with 'yes' or 'no'. Would you like to chat with a human agent?", false);
        }
        userInput.value = '';
        return;
    }
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
    // Check for gallery request
    if (message.toLowerCase().includes('gallery') || message.toLowerCase().includes('open gallery')) {
        addMessage("Opening our beautiful gallery for you! 💅✨", false);
        setTimeout(() => {
            window.location.href = 'services.html?openGallery=true';
        }, 1000);
        return;
    }
    
    // Check for reviews request
    if (message.toLowerCase().includes('review') || message.toLowerCase().includes('reviews')) {
        addMessage("We have a 4.9/5 star rating based on 127 reviews! <br><br><a href='reviews.html' style='color:#d653a0; font-weight:bold; text-decoration:underline;'>Click here to view all reviews</a>", false);
        return;
    }
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = '<p>Typing...</p>';
    typingDiv.id = 'typing-indicator';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Get bot response
    const botResponse = await getAIResponse(message);
    
    // Remove typing indicator
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    // Check for agent handoff request
    if (botResponse === 'AGENT_HANDOFF_REQUESTED') {
        addMessage("Would you like to chat with a human agent on WhatsApp?", false);
        
        // Add Yes/No buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'agent-buttons';
        buttonsDiv.innerHTML = `
            <button class="agent-btn agent-btn-yes" onclick="handleAgentResponse(true)">Yes</button>
            <button class="agent-btn agent-btn-no" onclick="handleAgentResponse(false)">No</button>
        `;
        chatMessages.appendChild(buttonsDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        awaitingAgentResponse = true;
        return;
    }
    
    // Check if response is the default (meaning misunderstood)
    if (botResponse === faqDatabase.default) {
        misunderstoodCount++;
        
        if (misunderstoodCount >= 2) {
            addMessage("I am having trouble understanding your question. Would you like to chat with a human agent on WhatsApp?", false);
            
            // Add Yes/No buttons
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'agent-buttons';
            buttonsDiv.innerHTML = `
                <button class="agent-btn agent-btn-yes" onclick="handleAgentResponse(true)">Yes</button>
                <button class="agent-btn agent-btn-no" onclick="handleAgentResponse(false)">No</button>
            `;
            chatMessages.appendChild(buttonsDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            awaitingAgentResponse = true;
        } else {
            addMessage(botResponse, false);
        }
    } else {
        misunderstoodCount = 0; // Reset counter on successful response
        addMessage(botResponse, false);
    }
}

// Handle agent response buttons
function handleAgentResponse(yes) {
    if (yes) {
        addMessage("Connecting you to our agent on WhatsApp...", false);
        setTimeout(() => {
            window.open('https://wa.me/27661007863', '_blank');
        }, 1000);
    } else {
        addMessage("No problem! How else can I help you today?", false);
    }
    awaitingAgentResponse = false;
    misunderstoodCount = 0;
    
    // Remove the buttons
    const buttonsDiv = document.querySelector('.agent-buttons');
    if (buttonsDiv) {
        buttonsDiv.remove();
    }
}

// Event listeners
sendButton.addEventListener('click', handleUserMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserMessage();
    }
});

// Focus input on load
userInput.focus();

// Add quick replies to initial message
const initialBotMessage = chatMessages.querySelector('.bot-message');
if (initialBotMessage) {
    addQuickReplies();
}
} // End of chatbot initialization check
