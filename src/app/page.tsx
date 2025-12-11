'use client';

import React, { useState, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Image as ImageIcon } from 'lucide-react';

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

// Extract text from ReactNode children
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

const PlanRenderer = ({ content, type, handleGenerateImage, isGeneratingImage }: PlanRendererProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: (props: any) => {
          const itemText = extractTextFromReactNode(props.children) || props.href || '';
          const onClick = async (e: React.MouseEvent) => {
            e.preventDefault();
            if (!itemText) return;
            // Prevent multiple image generation requests
            if (isGeneratingImage) return; 
            await handleGenerateImage(itemText, type);
          };
          return (
            <a
              href="#"
              onClick={onClick}
              className="text-indigo-400 hover:underline inline-flex items-center gap-2 disabled:opacity-50"
              aria-label={`Generate image for ${itemText}`}
            >
              <span>{itemText}</span>
              {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </a>
          );
        },
      } as any}
    >
      {content}
    </ReactMarkdown>
  );
};

export default function FitnessPlannerApp() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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
    mode: 'onSubmit',
  });

  const onSubmit = async (data: UserDetails) => {
    setIsLoading(true);
    setPlan(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Plan generation failed');
      const json = await res.json();
      if (!json?.plan) throw new Error('Bad response from server');
      setPlan(json.plan as Plan);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
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
      if (!res.ok) throw new Error('Image generation failed');
      const data = await res.json();
      if (!data?.imageUrl) throw new Error('No image returned');
      setModalImage(data.imageUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to generate image.');
    } finally {
      setImageLoading(false);
    }
  };
  
  // Close modal on Escape key press
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalImage(null);
      }
    };
    if (modalImage) {
      window.addEventListener('keydown', handleKeydown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [modalImage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      {/* Header */}
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-indigo-400 flex justify-center items-center gap-3">
          ⚡ AI Fitness Coach
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Personalized plans powered by Gemini</p>
      </motion.header>

      {/* Full-width horizontal form */}
      <Card className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-10">
        <CardHeader>
          <CardTitle className="text-xl text-white font-bold">Your Details</CardTitle>
          <p className="text-gray-400 text-sm">Fill out your details to get your personalized plan</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              // Responsive Grid Layout: 2 cols on mobile, 3 on medium, 5 on large
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {/* Text Inputs (Name, Age, Height, Weight) */}
              {(['name', 'age', 'height', 'weight'] as Array<keyof UserDetails>).map((key) => (
                <FormField key={key} control={form.control} name={key} render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-300">{key.charAt(0).toUpperCase() + key.slice(1)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={key === 'age' ? 'number' : 'text'}
                        className="bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                        required={key !== 'name'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              
              {/* All Select Inputs (Gender, Goal, Level, Location, Diet) - Mapped */}
              {[
                { name: 'gender', label: 'Gender', options: ['Male', 'Female', 'Other'] },
                { name: 'fitnessGoal', label: 'Goal', options: ['Weight Loss', 'Muscle Gain', 'Maintenance'] },
                { name: 'fitnessLevel', label: 'Level', options: ['Beginner', 'Intermediate', 'Advanced'] },
                { name: 'workoutLocation', label: 'Location', options: ['Home', 'Gym', 'Outdoor'] },
                { name: 'dietaryPreferences', label: 'Diet', options: ['Veg', 'Non-Veg', 'Vegan', 'Keto'] },
              ].map(({ name, label, options }) => (
                <FormField key={name} control={form.control} name={name as keyof UserDetails} render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-gray-300">{label}</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={(val) => field.onChange(val)}>
                        <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                          <SelectValue placeholder={`Select ${label}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 text-white">
                          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}

              {/* Submit Button */}
              {/* Span across all columns to ensure button is full-width below the inputs */}
              <div className="col-span-2 md:col-span-3 lg:col-span-5 w-full">
                <Button
                  type="submit"
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  {isLoading ? 'Generating...' : 'Generate Plan'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* AI Response */}
      <div className="space-y-6">
        {plan ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {/* AI Tips */}
            <Card className="mb-6 border-l-4 border-indigo-500 shadow-lg rounded-xl bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-indigo-400">AI Tips & Motivation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{plan.ai_tips}</p>
              </CardContent>
            </Card>

            {/* Workout Plan */}
            <Card className="mb-6 shadow-lg rounded-xl bg-gray-800 text-white">
              <CardHeader>
                <CardTitle>🏋️ Workout Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-sm text-gray-400">Click any exercise to generate an image</div>
                <PlanRenderer
                  content={plan.workout_plan_markdown}
                  type="workout"
                  handleGenerateImage={handleGenerateImage}
                  isGeneratingImage={imageLoading}
                />
              </CardContent>
            </Card>

            {/* Diet Plan */}
            <Card className="shadow-lg rounded-xl bg-gray-800 text-white">
              <CardHeader>
                <CardTitle>🥗 Diet Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-sm text-gray-400">Click any meal/snack to generate a photo</div>
                <PlanRenderer
                  content={plan.diet_plan_markdown}
                  type="food"
                  handleGenerateImage={handleGenerateImage}
                  isGeneratingImage={imageLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-lg">
            Fill out your details to generate your personalized plan!
          </div>
        )}
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalImage(null)}
        >
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            src={modalImage}
            alt="Generated"
            className="max-h-[80vh] max-w-[80vw] rounded-2xl shadow-xl cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}