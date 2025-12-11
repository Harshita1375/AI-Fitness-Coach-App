'use client';

import React, { useState, ReactNode, useRef } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Image as ImageIcon, Volume2 } from 'lucide-react';

interface UserDetails {
  name: string;
  age: number | undefined;
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

const extractTextFromReactNode = (children: ReactNode): string => {
  if (!children) return '';
  if (typeof children === 'string') return children.trim();
  if (Array.isArray(children)) return children.map(c => (typeof c === 'string' ? c : '')).join(' ').trim();
  return '';
};

interface PlanRendererProps {
  content: string;
  type: 'workout' | 'food';
  handleGenerateImage: (item: string, type: 'workout' | 'food') => Promise<void>;
  isGeneratingImage: boolean;
}

const PlanRenderer = ({ content, type, handleGenerateImage, isGeneratingImage }: PlanRendererProps) => (
  <div className="prose prose-invert max-w-none text-white">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: (props: any) => {
          const itemText = extractTextFromReactNode(props.children) || props.href || '';
          const onClick = async (e: React.MouseEvent) => {
            e.preventDefault();
            if (!itemText || isGeneratingImage) return;
            await handleGenerateImage(itemText, type);
          };
          return (
            <a
              href="#"
              onClick={onClick}
              className="text-indigo-400 hover:underline inline-flex items-center gap-2"
            >
              <span>{itemText}</span>
              {isGeneratingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </a>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default function FitnessPlannerApp() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const form = useForm<UserDetails>({
    defaultValues: {
      name: '',
      age: undefined,
      gender: '',
      height: '',
      weight: '',
      fitnessGoal: '',
      fitnessLevel: '',
      workoutLocation: '',
      dietaryPreferences: '',
    },
  });

  // 🔊 PLAY AUDIO
  const handleReadAloud = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const res = await fetch("/api/read-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Audio generation failed");

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
    } catch (err) {
      console.error(err);
      alert("Failed to generate audio.");
    }
  };

  // ⛔ STOP AUDIO
  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const onSubmit = async (data: UserDetails) => {
    setIsLoading(true);
    setPlan(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json?.plan) setPlan(json.plan);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Failed to generate plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (item: string, type: 'workout' | 'food') => {
    try {
      setImageLoading(true);
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, type }),
      });

      const data = await res.json();
      if (data?.imageUrl) setModalImage(data.imageUrl);
    } catch (err) {
      alert('Failed to generate image.');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">

      {/* HEADER */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-extrabold text-indigo-400">
          ⚡ AI Fitness Coach
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Personalized plans powered by Gemini</p>
      </motion.header>

      {/* USER FORM */}
      <Card className="bg-gray-800 p-6 mb-10 border border-gray-700 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Your Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {(['name', 'age', 'height', 'weight'] as Array<keyof UserDetails>).map((key) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{key.toUpperCase()}</FormLabel>
                      <FormControl>
                        <Input {...field} type={key === 'age' ? 'number' : 'text'} className="bg-gray-700 text-white"/>
                      </FormControl>
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
                      <Select value={String(field.value)} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-gray-700 text-white">
                          <SelectValue placeholder={label} />
                        </SelectTrigger>
                        <SelectContent className="text-white bg-gray-800">
                          {options.map((o) => (
                            <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              ))}

              <div className="col-span-full">
                <Button className="w-full bg-indigo-600" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Zap className="h-4 w-4"/>}
                  Generate Plan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* DISPLAY PLAN */}
      {plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* AI Tips */}
          <Card className="bg-gray-800 mb-6 border-l-4 border-indigo-500">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-indigo-400">AI Tips & Motivation</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => handleReadAloud(plan.ai_tips)} className="bg-indigo-600">
                  <Volume2 className="h-4 w-4 mr-2" /> Read
                </Button>
                <Button onClick={handleStopAudio} className="bg-red-600">
                  Stop
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-white">
              <div className="prose prose-invert max-w-none text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {plan.ai_tips}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Workout Plan */}
          <Card className="bg-gray-800 mb-6">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white">🏋️ Workout Plan</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => handleReadAloud(plan.workout_plan_markdown)} className="bg-indigo-600">
                  <Volume2 className="h-4 w-4 mr-2" /> Read
                </Button>
                <Button onClick={handleStopAudio} className="bg-red-600">
                  Stop
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-white">
              <PlanRenderer
                content={plan.workout_plan_markdown}
                type="workout"
                handleGenerateImage={handleGenerateImage}
                isGeneratingImage={imageLoading}
              />
            </CardContent>
          </Card>

          {/* Diet Plan */}
          <Card className="bg-gray-800">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white">🥗 Diet Plan</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => handleReadAloud(plan.diet_plan_markdown)} className="bg-indigo-600">
                  <Volume2 className="h-4 w-4 mr-2" /> Read
                </Button>
                <Button onClick={handleStopAudio} className="bg-red-600">
                  Stop
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-white">
              <PlanRenderer
                content={plan.diet_plan_markdown}
                type="food"
                handleGenerateImage={handleGenerateImage}
                isGeneratingImage={imageLoading}
              />
            </CardContent>
          </Card>

        </motion.div>
      )}

      {/* IMAGE MODAL */}
      {modalImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
          onClick={() => setModalImage(null)}
        >
          <motion.img
            src={modalImage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl max-h-[80vh] max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
