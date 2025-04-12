/**
 * Modified index.js - Local Emotion Offload Plugin for SillyTavern
 *
 * Now it extracts the last few replies using the properties 'mes' for message text and 'name' for sender,
 * and it attempts to determine the user and character names.
 */

import { getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

// Retrieve the SillyTavern context containing chat and character info
const context = SillyTavern.getContext();

eventSource.on(event_types.MESSAGE_SENT, async (data) => {
    console.log("Local Emotion Plugin: MESSAGE_SENT event captured");

    const chatLog = context.chat;
    if (!chatLog || chatLog.length === 0) {
        return; // No messages; nothing to process
    }

    // Get the last few messages for context (e.g., 3 messages)
    const numMessagesToInclude = 5;
    const recentMessages = chatLog.slice(-numMessagesToInclude);
    
    // Format messages using the proper property names: "name" for sender and "mes" for text.
    const formattedMessages = recentMessages.map(msg => {
        const sender = msg.name || "unknown";
        const content = msg.mes || '';
        return `[${sender}] ${content}`;
    }).join("\n");

    // Determine the character and the user names.
    // First, try if the active character is defined.
    let charName = "Unknown";
    if (context.characterId && context.characters && context.characters[context.characterId] && context.characters[context.characterId].name) {
        charName = context.characters[context.characterId].name;
    } else {
        // Fallback strategy: Assume the last message's sender is the user.
        // Then, scan backwards for the first message from a different sender, and treat that as the character.
        const lastSender = chatLog[chatLog.length - 1].name || "User";
        let userName = lastSender;
        for (let i = chatLog.length - 2; i >= 0; i--) {
            const candidate = chatLog[i].name;
            if (candidate && candidate !== lastSender) {
                charName = candidate;
                break;
            }
        }
        // Assign the user name as the very last sender.
        userName = lastSender;
        // For prompt clarity, you might swap the order if necessary.
        // In this example, we assume the last message is from the user (e.g. Mia)
        // and a previous message from a different sender is the character (e.g. Shego).
    }

    // For completeness, also determine the user's name.
    // If context has a dedicated user name, use that; otherwise, take the last sender.
    let userName = (context.user && context.user.name) || chatLog[chatLog.length - 1].name || "User";

    // Build the emotion prompt including both names. THIS IS WHERE THE PROMPT IS GENERATED emotionPrompt gets used a lot and will become a variable.
    const emotionPrompt = `
### Instruction:
Given the interaction between ${userName} (the user) and ${charName} (the character), reflect on the emotional tone in their conversation.
Based on the text below:

${formattedMessages}

How might ${charName} be feeling about this interaction? Provide a thoughtful emotional analysis.

### Response:
`;
    console.log("Local Emotion Plugin: Built emotion prompt:", emotionPrompt);
    console.log("Prompt length (chars):", emotionPrompt.length);

    try {
        // Send the request to the local LLM endpoint YOU NEED TO CHANGE THESE VARIABLES DUH, BUT FEEL FREE TO TOTALLY FIX THIS. THIS IS THE IMPORTANT BIT FOR EDITING.
        const response = await fetch("http://localhost:5000/v1/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: emotionPrompt,
                max_tokens: 1200,
                do_sample: true,
                temperature: 1.0,
                top_p: 0.9,
                top_k: 40,
                repetition_penalty: 1.0
            })
        });
        
        const result = await response.json();
        let reasoningText;
        if (result && result.generated_text) {
            reasoningText = result.generated_text.trim();
        } else if (result.choices && result.choices.length > 0) {
            reasoningText = result.choices[0].text.trim();
        } else {
            console.warn("Local Emotion Plugin: No valid response from LLM.");
            return;
        }
        
        console.log("Local Emotion Plugin: Received inner thought:", reasoningText);
        
        if (reasoningText) {
            // Inject the generated inner thought into the chat context as a system message.
            context.chat.push({
                sender: "system",
                content: `(Inner Thought: ${reasoningText})`,
                hidden: false  // Change to true if you prefer not to show it to the user.
            });
        }
    } catch (error) {
        console.error("Local Emotion Plugin: Error calling local LLM endpoint", error);
    }
});
