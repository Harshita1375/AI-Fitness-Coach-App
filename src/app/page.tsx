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

const extractTextFromReactNode = (children: ReactNode): string => {
  if (!children) return '';
  if (typeof children === 'string') return children.trim();
  if (Array.isArray(children)) {
    return children.map(c => (typeof c === 'string' ? c : '')).join(' ').trim();
  }
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
            await handleGenerateImage(itemText, type);
          };

          return (
            <a
              href="#"
              onClick={onClick}
              className="text-indigo-600 hover:underline inline-flex items-center gap-2"
              aria-label={`Generate image for ${itemText}`}
            >
              <span>{itemText}</span>
              <ImageIcon className="h-4 w-4" />
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
      name: 'Alex',
      age: 30,
      gender: 'Male',
      height: '180cm',
      weight: '80kg',
      fitnessGoal: 'Muscle Gain',
      fitnessLevel: 'Intermediate',
      workoutLocation: 'Gym',
      dietaryPreferences: 'Non-Veg',
    },
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

      if (!res.ok) {
        const txt = await res.text();
        console.error('Plan API error:', txt);
        throw new Error('Plan generation failed.');
      }

      const json = await res.json();
      if (!json?.plan) throw new Error('Bad plan response from server.');

      setPlan(json.plan as Plan);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('Failed to generate plan. Check server logs or console for details.');
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

      if (!res.ok) {
        const text = await res.text();
        console.error('Image API error:', text);
        alert('Failed to generate image. Check server logs.');
        return;
      }

      const data = await res.json();
      if (!data?.imageUrl) {
        console.error('Image API returned no imageUrl:', data);
        alert('Image generation returned no image.');
        return;
      }

      setModalImage(data.imageUrl);
    } catch (err) {
      console.error('Image generation failed:', err);
      alert('Failed to generate image.');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Image modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={modalImage}
            alt="Generated"
            className="max-h-[80vh] max-w-[80vw] rounded-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex justify-center items-center">
          <Zap className="mr-3 h-8 w-8 text-indigo-500" /> AI Fitness Coach
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Personalized plans powered by Gemini</p>
      </motion.header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg sticky top-8">
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {(['name', 'age', 'height', 'weight'] as Array<keyof UserDetails>).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
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
                        <FormControl>
                          <Select value={String(field.value)} onValueChange={(val) => field.onChange(val)}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generating Plan...' : 'Generate Personalized Plan'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {plan ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card className="mb-8 border-indigo-500 border-l-4">
                <CardHeader>
                  <CardTitle className="text-indigo-600 dark:text-indigo-400">AI Tips & Motivation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{plan.ai_tips}</p>
                </CardContent>
              </Card>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>🏋️ Workout Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-sm text-gray-500">Click any linked exercise to generate an image.</div>
                  <PlanRenderer
                    content={plan.workout_plan_markdown}
                    type="workout"
                    handleGenerateImage={handleGenerateImage}
                    isGeneratingImage={imageLoading}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🥗 Diet Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-sm text-gray-500">Click any linked meal/snack to generate a photo.</div>
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
            <div className="flex items-center justify-center min-h-[50vh] text-gray-500 dark:text-gray-400 text-lg">
              Fill out your details to generate your personalized plan!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
