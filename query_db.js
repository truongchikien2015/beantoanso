import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: topics } = await supabase.from('topics').select('id, slug, label');
  console.log('TOPICS:', topics);
  
  if (topics && topics.length > 0) {
    const { data: questions } = await supabase.from('questions').select('id, topic_id, scene');
    console.log('QUESTIONS COUNT:', questions?.length);
    console.log('FIRST 3 QUESTIONS:', questions?.slice(0, 3));
  }
}
check();
