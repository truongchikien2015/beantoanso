


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_teacher_topic_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_teacher_topic_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."learning_paths" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "topic_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."learning_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "gender" "text",
    "birth_year" integer,
    "avatar_url" "text",
    "xp" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "total_score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_slug" "text" NOT NULL,
    "question" "text" NOT NULL,
    "option_a" "text" NOT NULL,
    "option_b" "text" NOT NULL,
    "option_c" "text" NOT NULL,
    "correct_option" "text" NOT NULL,
    "explanation" "text" DEFAULT ''::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "min_age" integer DEFAULT 0,
    "max_age" integer DEFAULT 99,
    "target_gender" "text" DEFAULT 'all'::"text",
    CONSTRAINT "questions_correct_option_check" CHECK (("correct_option" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text"]))),
    CONSTRAINT "questions_target_gender_check" CHECK (("target_gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "player_id" "text" NOT NULL,
    "nickname" "text" NOT NULL,
    "mission_score" integer DEFAULT 0 NOT NULL,
    "quiz_score" integer DEFAULT 0 NOT NULL,
    "total_score" integer DEFAULT 0 NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "badge" "text" DEFAULT ''::"text" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "player_id" "text" NOT NULL,
    "nickname" "text" NOT NULL,
    "topic_slug" "text" NOT NULL,
    "topic_label" "text" NOT NULL,
    "selected_option" "text" NOT NULL,
    "correct_option" "text" NOT NULL,
    "is_correct" boolean DEFAULT false NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "student_answers_correct_option_check" CHECK (("correct_option" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text"]))),
    CONSTRAINT "student_answers_selected_option_check" CHECK (("selected_option" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text"])))
);


ALTER TABLE "public"."student_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_learning_path_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path_id" "uuid" NOT NULL,
    "step_order" integer NOT NULL,
    "step_type" "text" NOT NULL,
    "topic_id" "text",
    "question_set_id" "uuid",
    CONSTRAINT "teacher_learning_path_steps_step_order_check" CHECK (("step_order" >= 1)),
    CONSTRAINT "teacher_learning_path_steps_step_type_check" CHECK (("step_type" = ANY (ARRAY['topic'::"text", 'question_set'::"text"])))
);


ALTER TABLE "public"."teacher_learning_path_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_learning_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_learning_paths_title_check" CHECK ((("char_length"("title") <= 200) AND ("char_length"("title") > 0)))
);


ALTER TABLE "public"."teacher_learning_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_question_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "topic_id" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_question_sets_title_check" CHECK ((("char_length"("title") <= 200) AND ("char_length"("title") > 0)))
);


ALTER TABLE "public"."teacher_question_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "set_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "option_a" "text" NOT NULL,
    "option_b" "text" NOT NULL,
    "option_c" "text" NOT NULL,
    "correct_option" "text" NOT NULL,
    "explanation" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_questions_correct_option_check" CHECK (("correct_option" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text"]))),
    CONSTRAINT "teacher_questions_explanation_check" CHECK (("char_length"("explanation") <= 500)),
    CONSTRAINT "teacher_questions_option_a_check" CHECK (("char_length"("option_a") <= 500)),
    CONSTRAINT "teacher_questions_option_b_check" CHECK (("char_length"("option_b") <= 500)),
    CONSTRAINT "teacher_questions_option_c_check" CHECK (("char_length"("option_c") <= 500)),
    CONSTRAINT "teacher_questions_question_check" CHECK ((("char_length"("question") <= 1000) AND ("char_length"("question") > 0)))
);


ALTER TABLE "public"."teacher_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_student_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "path_id" "uuid" NOT NULL,
    "step_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    CONSTRAINT "teacher_student_progress_score_check" CHECK (("score" >= 0))
);


ALTER TABLE "public"."teacher_student_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "email" "text",
    "class_name" "text",
    "student_code" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "assigned_path_id" "uuid",
    "assigned_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_students_nickname_check" CHECK ((("char_length"("nickname") <= 100) AND ("char_length"("nickname") > 0)))
);


ALTER TABLE "public"."teacher_students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_students_duplicate" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "email" "text",
    "class_name" "text",
    "student_code" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "assigned_path_id" "uuid",
    "assigned_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_students_nickname_check" CHECK ((("char_length"("nickname") <= 100) AND ("char_length"("nickname") > 0)))
);


ALTER TABLE "public"."teacher_students_duplicate" OWNER TO "postgres";


COMMENT ON TABLE "public"."teacher_students_duplicate" IS 'This is a duplicate of teacher_students';



CREATE TABLE IF NOT EXISTS "public"."teacher_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "topic_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_topics_label_check" CHECK ((("char_length"("label") <= 100) AND ("char_length"("label") > 0))),
    CONSTRAINT "teacher_topics_topic_key_check" CHECK ((("char_length"("topic_key") <= 50) AND ("char_length"("topic_key") > 0)))
);


ALTER TABLE "public"."teacher_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teachers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_uid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "school_id" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teachers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text" DEFAULT '📚'::"text" NOT NULL,
    "color" "text" DEFAULT 'indigo'::"text" NOT NULL,
    "topic_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "active_path_id" "uuid",
    "completed_topics" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "daily_challenges" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."learning_paths"
    ADD CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_answers"
    ADD CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_learning_path_steps"
    ADD CONSTRAINT "teacher_learning_path_steps_path_id_step_order_key" UNIQUE ("path_id", "step_order");



ALTER TABLE ONLY "public"."teacher_learning_path_steps"
    ADD CONSTRAINT "teacher_learning_path_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_learning_paths"
    ADD CONSTRAINT "teacher_learning_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_question_sets"
    ADD CONSTRAINT "teacher_question_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_questions"
    ADD CONSTRAINT "teacher_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_student_progress"
    ADD CONSTRAINT "teacher_student_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_student_progress"
    ADD CONSTRAINT "teacher_student_progress_student_id_step_id_key" UNIQUE ("student_id", "step_id");



ALTER TABLE ONLY "public"."teacher_students_duplicate"
    ADD CONSTRAINT "teacher_students_duplicate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_students_duplicate"
    ADD CONSTRAINT "teacher_students_duplicate_student_code_key" UNIQUE ("student_code");



ALTER TABLE ONLY "public"."teacher_students"
    ADD CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_students"
    ADD CONSTRAINT "teacher_students_student_code_key" UNIQUE ("student_code");



ALTER TABLE ONLY "public"."teacher_topics"
    ADD CONSTRAINT "teacher_topics_created_by_topic_key_key" UNIQUE ("created_by", "topic_key");



ALTER TABLE ONLY "public"."teacher_topics"
    ADD CONSTRAINT "teacher_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_auth_uid_key" UNIQUE ("auth_uid");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_answers_player" ON "public"."student_answers" USING "btree" ("player_id");



CREATE INDEX "idx_answers_timestamp" ON "public"."student_answers" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_paths_is_active" ON "public"."learning_paths" USING "btree" ("is_active");



CREATE INDEX "idx_questions_is_active" ON "public"."questions" USING "btree" ("is_active");



CREATE INDEX "idx_questions_topic_slug" ON "public"."questions" USING "btree" ("topic_slug");



CREATE INDEX "idx_results_completed" ON "public"."results" USING "btree" ("completed_at" DESC);



CREATE INDEX "idx_results_player_id" ON "public"."results" USING "btree" ("player_id");



CREATE INDEX "idx_teachers_auth_uid" ON "public"."teachers" USING "btree" ("auth_uid");



CREATE INDEX "idx_teachers_email" ON "public"."teachers" USING "btree" ("email");



CREATE INDEX "idx_teachers_is_active" ON "public"."teachers" USING "btree" ("is_active");



CREATE INDEX "idx_tlp_active" ON "public"."teacher_learning_paths" USING "btree" ("created_by", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_tlp_created_by" ON "public"."teacher_learning_paths" USING "btree" ("created_by");



CREATE INDEX "idx_tlps_path_id" ON "public"."teacher_learning_path_steps" USING "btree" ("path_id");



CREATE INDEX "idx_topics_is_active" ON "public"."topics" USING "btree" ("is_active");



CREATE INDEX "idx_tq_set_id" ON "public"."teacher_questions" USING "btree" ("set_id");



CREATE INDEX "idx_tqs_active" ON "public"."teacher_question_sets" USING "btree" ("created_by", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_tqs_created_by" ON "public"."teacher_question_sets" USING "btree" ("created_by");



CREATE INDEX "idx_ts_created_by" ON "public"."teacher_students" USING "btree" ("created_by");



CREATE INDEX "idx_ts_student_code" ON "public"."teacher_students" USING "btree" ("student_code");



CREATE INDEX "idx_tsp_path_id" ON "public"."teacher_student_progress" USING "btree" ("path_id");



CREATE INDEX "idx_tsp_student_id" ON "public"."teacher_student_progress" USING "btree" ("student_id");



CREATE INDEX "idx_tt_active" ON "public"."teacher_topics" USING "btree" ("created_by", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_tt_created_by" ON "public"."teacher_topics" USING "btree" ("created_by");



CREATE INDEX "teacher_students_duplicate_created_by_idx" ON "public"."teacher_students_duplicate" USING "btree" ("created_by");



CREATE INDEX "teacher_students_duplicate_student_code_idx" ON "public"."teacher_students_duplicate" USING "btree" ("student_code");



CREATE OR REPLACE TRIGGER "teachers_updated_at" BEFORE UPDATE ON "public"."teachers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "tlp_updated_at" BEFORE UPDATE ON "public"."teacher_learning_paths" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "tq_updated_at" BEFORE UPDATE ON "public"."teacher_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "tqs_updated_at" BEFORE UPDATE ON "public"."teacher_question_sets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "ts_updated_at" BEFORE UPDATE ON "public"."teacher_students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "tt_updated_at" BEFORE UPDATE ON "public"."teacher_topics" FOR EACH ROW EXECUTE FUNCTION "public"."update_teacher_topic_updated_at"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_topic_slug_fkey" FOREIGN KEY ("topic_slug") REFERENCES "public"."topics"("slug") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_learning_path_steps"
    ADD CONSTRAINT "teacher_learning_path_steps_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."teacher_learning_paths"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_learning_path_steps"
    ADD CONSTRAINT "teacher_learning_path_steps_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "public"."teacher_question_sets"("id");



ALTER TABLE ONLY "public"."teacher_learning_paths"
    ADD CONSTRAINT "teacher_learning_paths_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_question_sets"
    ADD CONSTRAINT "teacher_question_sets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_questions"
    ADD CONSTRAINT "teacher_questions_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."teacher_question_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_progress"
    ADD CONSTRAINT "teacher_student_progress_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."teacher_learning_paths"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_progress"
    ADD CONSTRAINT "teacher_student_progress_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."teacher_learning_path_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_progress"
    ADD CONSTRAINT "teacher_student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."teacher_students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_students"
    ADD CONSTRAINT "teacher_students_assigned_path_id_fkey" FOREIGN KEY ("assigned_path_id") REFERENCES "public"."teacher_learning_paths"("id");



ALTER TABLE ONLY "public"."teacher_students"
    ADD CONSTRAINT "teacher_students_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_students_duplicate"
    ADD CONSTRAINT "teacher_students_duplicate_assigned_path_id_fkey" FOREIGN KEY ("assigned_path_id") REFERENCES "public"."teacher_learning_paths"("id");



ALTER TABLE ONLY "public"."teacher_students_duplicate"
    ADD CONSTRAINT "teacher_students_duplicate_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_topics"
    ADD CONSTRAINT "teacher_topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_active_path_id_fkey" FOREIGN KEY ("active_path_id") REFERENCES "public"."learning_paths"("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all on learning_paths" ON "public"."learning_paths" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all on questions" ON "public"."questions" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all on results" ON "public"."results" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all on student_answers" ON "public"."student_answers" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all on topics" ON "public"."topics" USING (true) WITH CHECK (true);



CREATE POLICY "Manage teachers (admin)" ON "public"."teachers" USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Read active teachers for auth" ON "public"."teachers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Teachers can manage their own topics" ON "public"."teacher_topics" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert own progress" ON "public"."user_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."user_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own progress" ON "public"."user_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."learning_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_full_access_tlp" ON "public"."teacher_learning_paths" USING (true) WITH CHECK (true);



CREATE POLICY "service_full_access_tlps" ON "public"."teacher_learning_path_steps" USING (true) WITH CHECK (true);



CREATE POLICY "service_full_access_tq" ON "public"."teacher_questions" USING (true) WITH CHECK (true);



CREATE POLICY "service_full_access_tqs" ON "public"."teacher_question_sets" USING (true) WITH CHECK (true);



CREATE POLICY "service_full_access_ts" ON "public"."teacher_students" USING (true) WITH CHECK (true);



CREATE POLICY "service_full_access_tsp" ON "public"."teacher_student_progress" USING (true) WITH CHECK (true);



ALTER TABLE "public"."student_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_learning_path_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_learning_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_question_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_student_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_students_duplicate" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teachers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."update_teacher_topic_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_teacher_topic_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_teacher_topic_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."learning_paths" TO "anon";
GRANT ALL ON TABLE "public"."learning_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_paths" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."results" TO "anon";
GRANT ALL ON TABLE "public"."results" TO "authenticated";
GRANT ALL ON TABLE "public"."results" TO "service_role";



GRANT ALL ON TABLE "public"."student_answers" TO "anon";
GRANT ALL ON TABLE "public"."student_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."student_answers" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_learning_path_steps" TO "anon";
GRANT ALL ON TABLE "public"."teacher_learning_path_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_learning_path_steps" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_learning_paths" TO "anon";
GRANT ALL ON TABLE "public"."teacher_learning_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_learning_paths" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_question_sets" TO "anon";
GRANT ALL ON TABLE "public"."teacher_question_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_question_sets" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_questions" TO "anon";
GRANT ALL ON TABLE "public"."teacher_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_questions" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_student_progress" TO "anon";
GRANT ALL ON TABLE "public"."teacher_student_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_student_progress" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_students" TO "anon";
GRANT ALL ON TABLE "public"."teacher_students" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_students" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_students_duplicate" TO "anon";
GRANT ALL ON TABLE "public"."teacher_students_duplicate" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_students_duplicate" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_topics" TO "anon";
GRANT ALL ON TABLE "public"."teacher_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_topics" TO "service_role";



GRANT ALL ON TABLE "public"."teachers" TO "anon";
GRANT ALL ON TABLE "public"."teachers" TO "authenticated";
GRANT ALL ON TABLE "public"."teachers" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































