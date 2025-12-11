# ⚡ AI Fitness Coach

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?logo=next.js)](https://nextjs.org/)  
[![React](https://img.shields.io/badge/React-17-blue?logo=react)](https://reactjs.org/)  
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.2-blue?logo=tailwind-css)](https://tailwindcss.com/)  
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange)](https://developers.google.com/)

---

## ✨ Overview

**AI Fitness Coach** is a personalized fitness and diet planning application powered by **Google's Gemini AI**. Users can input their personal details, fitness goals, and preferences to receive:  

- **Custom 7-day workout plans**  
- **Detailed diet plans**  
- **Motivational AI tips**  

The app also provides **dynamic image generation** for exercises and meals, helping users visualize their plans instantly.  

This is a **full-stack AI application** built with **Next.js, React, Tailwind CSS**, and the **Google Gemini API**.

---

## 🚀 Demo

Experience AI Fitness Coach in action:  

*(Embed GIF or live demo link here)*

---

## 📸 Screenshots

1. **User Input Form** – Fill out your personal details to start your fitness journey.  
2. **Generated Workout & Diet Plan** – View a structured 7-day plan with interactive elements.  
3. **Dynamic Image Generation** – Click any exercise or meal to instantly generate a visual.

---

## 🏋️ Key Features

- **Personalized Plans**: Tailored workouts and diet based on age, gender, height, weight, goal, fitness level, location, and diet preferences.  
- **Powered by Gemini AI**: Generates intelligent fitness and diet plans.  
- **Interactive UI**: Responsive, clean interface built with Next.js, React, Tailwind CSS, and Shadcn UI components.  
- **Dynamic Image Generation**: Visualize exercises or meals on demand.  
- **Structured Output**: Plans are presented in Markdown for easy readability.

---

## ⚡ AI Tips & Motivation

1. **Progressive Overload**: Gradually increase workout intensity (reps, sets, weight, or difficulty) to stimulate muscle growth.  
2. **Optimal Nutrition**: Maintain high-quality protein intake, complex carbs for energy, and healthy fats for hormone balance.  
3. **Rest & Recovery**: Prioritize 7–9 hours of sleep, active recovery days, and proper hydration to optimize performance.

---

## ⚙️ How It's Built

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI, Framer Motion  
- **Backend**: Next.js API Routes (Serverless Functions)  
- **AI Model**: Google Gemini API (`gemini-2.5-flash`)  
- **Image Generation**: Gemini API or alternatives like DALL-E/Imagen  

---

## 🛠️ API Endpoints

- **`/api/generate-plan`** – Accepts user details (JSON) and returns a 7-day workout & diet plan in Markdown plus AI tips.  
- **`/api/generate-image`** – Accepts an exercise or meal name (string) and returns a generated image URL.

---

## 📦 Getting Started

### Prerequisites

- Node.js v18+  
- npm or Yarn  
- Google Cloud Project with Gemini API enabled  
- Google Gemini API key  

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-fitness-coach

# Install dependencies
npm install
# or
yarn install
## 📦 Setup Environment Variables

Create a `.env.local` file in the root directory:

```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
🚀 Running the App
npm run dev
# or
yarn dev
```

Open your browser at http://localhost:3000

## 🤝 Contributing

Fork the repository

Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

Make your changes

Commit your changes:
```bash
git commit -m 'feat: Add new feature'
```

Push to your branch:
```bash
git push origin feature/your-feature-name
```

Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
