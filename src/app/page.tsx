'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Volume2, Image, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

// Types
interface UserDetails {
  name: string;
  age: number;
  gender: string;
  height: string;
  weight: string;
  fitnessGoal: string;
  fitnessLevel: string;
  workoutLocation: string;
  dietaryPreferences: string;
}

interface Plan {
  workout_plan_markdown: string;
  diet_plan_markdown: string;
  ai_tips: string;
}

// Modal for generated images
const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => {
    if (!src) return null;
    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative bg-white p-4 rounded-xl shadow-2xl max-w-lg max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <img src={src} alt="Generated Visual" className="rounded-lg object-contain w-full h-full" />
                <Button className="absolute top-2 right-2" variant="ghost" onClick={onClose}>&times;</Button>
            </motion.div>
        </div>
    );
};

export default function FitnessPlannerApp() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const form = useForm<UserDetails>({
    defaultValues: {
      name: 'Alex', age: 30, gender: 'Male', height: '180cm', weight: '80kg',
      fitnessGoal: 'Muscle Gain', fitnessLevel: 'Intermediate', workoutLocation: 'Gym',
      dietaryPreferences: 'Non-Veg'
    },
  });

  // --- Generate Plan ---
  const onSubmit = async (data: UserDetails) => {
    setIsLoading(true);
    setPlan(null);
    if (currentAudio) currentAudio.pause();

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Plan generation failed.");
      const result = await response.json();
      setPlan(result.plan);
    } catch (error) {
      console.error(error);
      alert("Failed to generate plan. Check server logs.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Text-to-Speech ---
  const handleReadPlan = useCallback(async (section: keyof Plan) => {
    if (!plan) return;

    if (currentAudio) {
      currentAudio.pause();
      if (isReading) {
        setIsReading(false);
        setCurrentAudio(null);
        return;
      }
    }

    setIsReading(true);

    try {
      const response = await fetch('/api/read-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plan[section] }),
      });

      if (!response.ok) throw new Error("Audio generation failed.");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsReading(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (error) {
      console.error(error);
      setIsReading(false);
      setCurrentAudio(null);
      alert("Failed to generate audio.");
    }
  }, [plan, currentAudio, isReading]);

  // --- Image Generation ---
  const handleGenerateImage = async (item: string, type: 'workout' | 'food') => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, type }),
      });

      if (!response.ok) throw new Error("Image generation failed.");
      
      const result = await response.json();
      setModalImage(result.imageUrl);

    } catch (error) {
      console.error(error);
      alert("Failed to generate image.");
    }
  };

  // --- Markdown Renderer with selective clickable exercises ---
  // Corrected PlanRenderer component
const PlanRenderer = ({ content, type }: { content: string, type: 'workout' | 'food' }) => {
    // Define all exercise names (you can expand this list)
    const exercises = [
      "Barbell Bench Press",
      "Incline Dumbbell Press",
      "Shoulder Press",
      "Squat",
      "Deadlift",
      "Pull-up",
      "Bicep Curl",
      "Tricep Extension"
    ];

    return (
      <div className="markdown-body">
        <ReactMarkdown
          components={{
            text: ({ node, children }) => {
              // 🎯 FIX: Safely check if children is an array and if the first element is a string.
              // In this context, children will be an array containing a single string node.
              const textContent = Array.isArray(children) && typeof children[0] === 'string' ? children[0] : '';
              
              if (!textContent) return <>{children}</>;

              // Split by exercise names and make only exercise names clickable
              const parts = textContent.split(new RegExp(`(${exercises.join('|')})`, 'g'));
              
              return (
                <>
                  {parts.map((part, idx) => exercises.includes(part.trim()) ? (
                    <Button
                      key={idx}
                      variant="link"
                      size="sm"
                      onClick={() => handleGenerateImage(part.trim(), type)}
                      className="p-0 h-auto text-blue-600 dark:text-blue-400"
                    >
                      {part} <Image size={16} className="ml-1" />
                    </Button>
                  ) : (
                    <span key={idx}>{part}</span>
                  ))}
                </>
              );
            },
            table: ({ children }) => <table className="w-full text-left border-collapse my-4">{children}</table>,
            th: ({ children }) => <th className="border-b-2 p-2">{children}</th>,
            td: ({ children }) => <td className="border-b p-2">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}
      
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center">
          <Zap className="mr-3 h-8 w-8 text-indigo-500" /> AI Fitness Coach
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Personalized plans powered by Gemini</p>
      </motion.header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <Card className="lg:col-span-1 shadow-lg h-fit sticky top-8">
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {['name', 'age', 'height', 'weight'].map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key as keyof UserDetails}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</FormLabel>
                        <FormControl>
                          <Input {...field} type={key === 'age' ? 'number' : 'text'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {[
                  { name: 'gender', label: 'Gender', options: ['Male', 'Female', 'Other'] },
                  { name: 'fitnessGoal', label: 'Goal', options: ['Weight Loss', 'Muscle Gain', 'Maintenance'] },
                  { name: 'fitnessLevel', label: 'Level', options: ['Beginner', 'Intermediate', 'Advanced'] },
                  { name: 'workoutLocation', label: 'Location', options: ['Home', 'Gym', 'Outdoor'] },
                  { name: 'dietaryPreferences', label: 'Diet', options: ['Veg', 'Non-Veg', 'Vegan', 'Keto'] },
                ].map(({ name, label, options }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof UserDetails}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${label}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {options.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Generating Plan...' : 'Generate Personalized Plan'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-2 space-y-8">
          {plan ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Your Custom Plan</h2>
              
              {/* AI Tips */}
              <Card className="mb-8 border-indigo-500 border-l-4">
                <CardHeader>
                  <CardTitle className="text-indigo-600 dark:text-indigo-400">AI Tips & Motivation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{plan.ai_tips}</p>
                </CardContent>
              </Card>

              {/* Workout Plan */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    🏋️ Workout Plan
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReadPlan('workout_plan_markdown')} 
                      disabled={isReading}
                      className={currentAudio && isReading ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      {currentAudio && isReading ? 'Stop Reading' : 'Read Workout'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlanRenderer content={plan.workout_plan_markdown} type="workout" />
                </CardContent>
              </Card>

              {/* Diet Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    🥗 Diet Plan
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReadPlan('diet_plan_markdown')} 
                      disabled={isReading}
                      className={currentAudio && isReading ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      {currentAudio && isReading ? 'Stop Reading' : 'Read Diet'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlanRenderer content={plan.diet_plan_markdown} type="food" />
                </CardContent>
              </Card>

              <div className="mt-8 text-center">
                <Button variant="default" size="lg">
                  <Save className="mr-2 h-5 w-5" /> Export Plan as PDF (Feature Placeholder)
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center min-h-[50vh]">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Fill out your details to generate your personalized plan!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
