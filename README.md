# st-Emotion
Emotion is a SillyTavern extension designed to offload and delegate emotion and conscience to another LLM generation in order to create more emotionally vivid characters with deeper personalities..

The hope of this project was to have SillyTavern characters to have more depth and personality and one issue that a single LLM generation can't do is reflect. This plugin allows me to tie into a 13b model running an OpenAI compatible endpoint and will allow for asyncronous completion.
The last few generations of conversation is fed out to the second API endpoint for completion and is used to grade the state of the story and how the character would feel and any inner thoughts, it is then sent privately to the prompt string for the SillyTavern character but is hidden from the user in conversation.


This is not ready for the mainstream yet, do not install via URL. You will have to modify my files to make this work. 
1. Install in your SillyTavern\public\scripts\extensions\third-party\ folder.
2. In index.js change  the IP address to match the IP address and OpenAI compatible API url of your text generation server. To check if the API endpoint is correct, curl the contents of the function below to check if your endpoint is being pointed to correctly. 
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
3. Change parameters to whatever you want, I personally hate my prompt but it is an example implementation that will allow for future development and refinement. ToDo:Menu options and sharables. 







I am not very good at this. I would really like to expand this with functionality that would use this to allow a Sillytavern character to offload in this way several different brain functions to other nodes as a sort of distributed approach to coherent personality. Any advice or collaboration is welcome.
