const API_KEY = "AIzaSyAtql3Nam2AXqiPSpI2y-m95WfVVEuY6ds";
// helper: call Gemini (v1 + gemini-1.5-flash)
async function callGeminiAI(promptText) {
  const endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + API_KEY;




  console.log("Calling endpoint:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    console.log("HTTP status:", res.status);

    const raw = await res.text();
    console.log("Raw response body (first 1000 chars):", raw.slice(0, 1000));

    if (!res.ok) {
      // Throw with the raw body so we can inspect the exact error in console
      throw new Error("API error. Status: " + res.status + ". Body starts: " + raw.slice(0, 500));
    }

    // parse JSON defensively
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      throw new Error("Invalid JSON from API");
    }

    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content) {
      throw new Error("API returned unexpected format. See console raw response.");
    }

    return json.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("callGeminiAI error:", err);
    throw err; // let analyzeProfile handle/display friendly message
  }
}

// analyzeProfile -> calls AI and updates the UI
async function analyzeProfile() {
  const textarea = document.getElementById("inputText");
  const scoreBox = document.getElementById("scoreBox");
  const headlineBox = document.getElementById("headlineBox");
  const aboutBox = document.getElementById("aboutBox");
  const skillBox = document.getElementById("skillBox");
  const swBox = document.getElementById("swBox");

  const text = textarea.value.trim();

// basic validation: minimum words + letters
const wordCount = text.split(/\s+/).length;
const hasLetters = /[a-zA-Z]/.test(text);

if (!text || wordCount < 20 || !hasLetters) {
  alert("Please paste a proper LinkedIn About section (at least 20 words).");
  return;
}


  // show loading
  scoreBox.innerText = "Loading...";
  headlineBox.innerText = "Loading...";
  aboutBox.innerText = "Loading...";
  skillBox.innerText = "Loading...";
  swBox.innerText = "Loading...";

 const prompt = `
You are an expert Senior IT Recruiter and LinkedIn Personal Branding Coach. 
Your goal is to transform a raw user input into a high-impact, top-tier LinkedIn profile that passes ATS (Applicant Tracking Systems) and attracts hiring managers.

Analyze the input text provided below and generate the output in the EXACT format required.

TEXT TO ANALYZE:
${text}

INSTRUCTIONS PER SECTION:

1. SCORE:
- Evaluate the input based on completeness, keyword usage, and professional impact.
- Give a strict numeric score from 0–100 (be critical).

2. HEADLINES:
- Create 3 distinct options using vertical bars (|) to separate keywords.
- Option 1: Professional & Direct (Standard industry titles).
- Option 2: Outcome-Focused (What value do they bring?).
- Option 3: "The Hook" (Creative and personality-driven).
- MUST include high-ranking keywords relevant to their stack (e.g., React, Frontend, Python).

3. ABOUT:
- Write a compelling "About" section using a "Hook -> Value -> Call to Action" structure.
- formatting: Use short paragraphs (max 3 lines), bullet points for readability, and plenty of whitespace.
- Tone: Human, enthusiastic, humble yet confident. Avoid buzzwords like "hardworking" without context.
- Start with a strong opening line about their passion for coding/tech.
- Mention their tech stack specifically.
- End with an invitation to connect.

4. SKILLS:
- Identify the user's current level based on the text.
- Suggest 5-8 logical next step technical skills to learn. (e.g., If they know HTML/CSS, suggest React/Tailwind, not Machine Learning).
- Focus on modern, high-demand industry tools.

5.STRENGTHS:
- Write 3–4 strengths in FIRST PERSON based strictly on the given text.
- Each strength should reflect real behavior, mindset, or learning style.
- Avoid generic phrases; make them specific to the input.

6.WEAKNESSES:
- Write 3–4 growth areas in FIRST PERSON based on the given text.
- Frame them positively as areas I am currently improving.
- Make them realistic, honest, and LinkedIn-safe.

IMPORTANT OUTPUT RULES:
- Output MUST contain all six main labels exactly as written: SCORE:, HEADLINES:, ABOUT:, SKILLS:, STRENGTHS:, WEAKNESSES:
- Do NOT add introductory text (like "Here is the analysis").
- Do NOT use markdown bolding () for the section labels themselves, just plain text with colons.
- Ensure the "About" section looks clean and is not a single block of text.

`;
  try {
    const aiOutput = await callGeminiAI(prompt);
    console.log("AI raw output:", aiOutput);

    // safe parsing using labels
    const getSection = (label) => {
      const re = new RegExp(label + "([\\s\\S]*?)(?=\\n[A-Z]+:|$)");
      const m = aiOutput.match(re);
      return m ? m[1].trim() : "";
    };

    const scoreMatch = aiOutput.match(/SCORE:\s*(\d{1,3})/);
    scoreBox.innerText = scoreMatch ? scoreMatch[1] + " / 100" : "N/A";

    const headlines = getSection("HEADLINES:") || "No headlines found";
    headlineBox.innerText = headlines;

    aboutBox.innerText = getSection("ABOUT:") || "No improved about found";
    skillBox.innerText = getSection("SKILLS:") || "No skills found";

    const strengths = getSection("STRENGTHS:") || "";
    const weaknesses = getSection("WEAKNESSES:") || "";
    swBox.innerText = (strengths ? ("Strengths: " + strengths + "\n") : "") + (weaknesses ? ("Weaknesses: " + weaknesses) : "");
  } catch (err) {
    // friendly UI error + console has full details
    scoreBox.innerText = "Error: " + (err.message || "API failed");
    headlineBox.innerText = "—";
    aboutBox.innerText = "—";
    skillBox.innerText = "—";
    swBox.innerText = "—";
  }
}
