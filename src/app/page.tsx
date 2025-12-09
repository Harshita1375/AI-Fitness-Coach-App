'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Volume2, Image } from 'lucide-react';

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

// Extract text safely from ReactNode
const extractTextFromReactNode = (children: ReactNode): string => {
  if (Array.isArray(children)) {
    const firstChild = children[0];
    if (typeof firstChild === 'string') return firstChild.trim();
  }
  return '';
};

// Markdown renderer
const PlanRenderer = ({ content, type, handleGenerateImage }: { content: string; type: 'workout' | 'food'; handleGenerateImage: (item: string, type: 'workout'|'food') => void }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    a: ({ children, node, ...props }) => {
      const itemText = extractTextFromReactNode(children);
      if (!itemText) return <>{children}</>;
      return (
        <a href={props.href} onClick={e => { e.preventDefault(); handleGenerateImage(itemText, type); }}
          style={{cursor:'pointer'}} className="text-blue-600 hover:underline">
          {itemText} <Image size={16} className="inline ml-1"/>
        </a>
      );
    },
    table: ({children}) => <table className="w-full text-left border-collapse my-4">{children}</table>,
    th: ({children}) => <th className="border-b-2 p-2">{children}</th>,
    td: ({children}) => <td className="border-b p-2">{children}</td>,
  }}>
    {content}
  </ReactMarkdown>
);

export default function FitnessPlannerApp() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const form = useForm<UserDetails>({
    defaultValues: {
      name: 'Alex', age: 30, gender: 'Male', height: '180cm', weight: '80kg',
      fitnessGoal: 'Muscle Gain', fitnessLevel: 'Intermediate', workoutLocation: 'Gym',
      dietaryPreferences: 'Non-Veg'
    },
  });

  const onSubmit = async (data: UserDetails) => {
    setIsLoading(true);
    setPlan(null);
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

  const handleGenerateImage = async (item: string, type: 'workout' | 'food') => {
    // Placeholder: implement your image API
    alert(`Generate image for: ${item} (${type})`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={()=>setModalImage(null)}>
          <img src={modalImage} alt="Generated" className="max-h-[80vh] max-w-[80vw]"/>
        </div>
      )}

      <motion.header initial={{ y:-50, opacity:0 }} animate={{ y:0, opacity:1 }} className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex justify-center items-center">
          <Zap className="mr-3 h-8 w-8 text-indigo-500"/> AI Fitness Coach
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Personalized plans powered by Gemini</p>
      </motion.header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg sticky top-8">
          <CardHeader><CardTitle>Your Details</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {['name','age','height','weight'].map(key => (
                  <FormField key={key} control={form.control} name={key as keyof UserDetails} render={({field}) => (
                    <FormItem>
                      <FormLabel>{key.charAt(0).toUpperCase()+key.slice(1)}</FormLabel>
                      <FormControl><Input {...field} type={key==='age'?'number':'text'}/></FormControl>
                      <FormMessage/>
                    </FormItem>
                  )}/>
                ))}

                {[
                  { name:'gender', label:'Gender', options:['Male','Female','Other']},
                  { name:'fitnessGoal', label:'Goal', options:['Weight Loss','Muscle Gain','Maintenance']},
                  { name:'fitnessLevel', label:'Level', options:['Beginner','Intermediate','Advanced']},
                  { name:'workoutLocation', label:'Location', options:['Home','Gym','Outdoor']},
                  { name:'dietaryPreferences', label:'Diet', options:['Veg','Non-Veg','Vegan','Keto']},
                ].map(({name,label,options}) => (
                  <FormField key={name} control={form.control} name={name as keyof UserDetails} render={({field}) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue placeholder={`Select ${label}`}/></SelectTrigger></FormControl>
                        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )}/>
                ))}

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4"/>}
                  {isLoading ? 'Generating Plan...' : 'Generate Personalized Plan'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {plan ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}>
              <Card className="mb-8 border-indigo-500 border-l-4">
                <CardHeader><CardTitle className="text-indigo-600 dark:text-indigo-400">AI Tips & Motivation</CardTitle></CardHeader>
                <CardContent><p className="whitespace-pre-line">{plan.ai_tips}</p></CardContent>
              </Card>

              <Card className="mb-8">
                <CardHeader><CardTitle>🏋️ Workout Plan</CardTitle></CardHeader>
                <CardContent><PlanRenderer content={plan.workout_plan_markdown} type="workout" handleGenerateImage={handleGenerateImage}/></CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>🥗 Diet Plan</CardTitle></CardHeader>
                <CardContent><PlanRenderer content={plan.diet_plan_markdown} type="food" handleGenerateImage={handleGenerateImage}/></CardContent>
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
