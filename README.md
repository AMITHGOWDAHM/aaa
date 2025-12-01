npm i 


 Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
node server.js

add env files 


policy     (((auth.uid())::text = buyer_address) OR (buyer_address ~~ 'razorpay_%'::text))

![alt text](image.png)



run in supabase 

CREATE TABLE public.datasets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text,
  tags ARRAY,
  ipfs_hash text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  uploader_address text NOT NULL,
  upload_timestamp timestamp with time zone DEFAULT now(),
  schema_json jsonb,
  preview_json jsonb,
  file_url text,
  downloads integer DEFAULT 0,
  preview_data text,
  preview_image_hash text,
  status text,
  CONSTRAINT datasets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dataset_id uuid,
  buyer_address text,
  purchased_at timestamp without time zone DEFAULT now(),
  tx_hash text NOT NULL DEFAULT ''::text,
  confirmed boolean DEFAULT false,
  amount_paid numeric,
  currency character varying,
  payment_method character varying,
  purchase_date timestamp without time zone DEFAULT now(),
  status text DEFAULT 'completed'::text,
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id)
);





/* ----------------------------------------------------
   Global Reset & Base
---------------------------------------------------- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html { scroll-behavior: smooth; }

body {
  font-family: "Inter", Arial, sans-serif;
  color: #111;
  background: #ffffff;
  line-height: 1.6;
  overflow-x: hidden;
}

/* Fade-up animation */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Scroll reveal */
.reveal {
  opacity: 0;
  animation: fadeUp 1s var(--delay, 0s) ease forwards;
  animation-timeline: view();
  animation-range: entry 0% cover 35%;
}

/* ----------------------------------------------------
   HERO SECTION (White with subtle gray glow)
---------------------------------------------------- */
.hero {
  height: 85vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
  background: linear-gradient(135deg, #fafafa, #ffffff);
  overflow: hidden;
}

.hero-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.hero::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0,0,0,0.08), transparent 70%);
  filter: blur(80px);
  opacity: 0.35;
  animation: glow 8s infinite alternate ease-in-out;
  z-index: 2;
}

@keyframes glow {
  from { transform: scale(0.9); opacity: 0.25; }
  to   { transform: scale(1.1); opacity: 0.45; }
}

.hero-inner {
  position: relative;
  max-width: 720px;
  text-align: center;
  animation: fadeUp 1s ease-out forwards;
  z-index: 3;
}

.hero-inner h1 {
  font-size: 3.2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #fff;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
}

.hero-inner p {
  font-size: 1.1rem;
  color: #fff;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
}

.hero-inner .sub {
  margin-top: 1rem;
  font-size: 0.95rem;
  color: #eee;
}

/* ----------------------------------------------------
   UNIVERSAL SECTION WRAPPER
---------------------------------------------------- */
.section {
  max-width: 1100px;
  margin: auto;
  padding: 5rem 1.5rem;
}

.section-title {
  text-align: center;
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  color: #000;
}

/* ----------------------------------------------------
   CARDS (Black text, white background, soft shadows)
---------------------------------------------------- */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 1.8rem;
  border: 1px solid #e5e5e5;
  box-shadow:
    0 2px 6px rgba(0,0,0,0.04),
    0 12px 32px rgba(0,0,0,0.06);
  transition: 0.35s ease;
}

.card:hover {
  transform: translateY(-10px);
  border-color: #000;
  box-shadow:
    0 6px 20px rgba(0,0,0,0.08),
    0 18px 40px rgba(0,0,0,0.12);
}

.card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.6rem;
  color: #000;
}

.card p {
  color: #444;
}

/* Scroll reveal */
.card { animation: fadeUp 1s ease forwards; opacity: 0; }
.card:nth-child(1){ animation-delay:.1s; }
.card:nth-child(2){ animation-delay:.2s; }
.card:nth-child(3){ animation-delay:.3s; }

/* ----------------------------------------------------
   DARK SECTIONS (light-gray tone)
---------------------------------------------------- */
.dark {
  background: #f4f4f4;
  color: #000;
  position: relative;
  overflow: hidden;
}

.dark::before {
  content: "";
  position: absolute;
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(0,0,0,0.08), transparent 75%);
  filter: blur(80px);
  opacity: 0.25;
  top: -50px;
  right: -50px;
  animation: floatLight 12s infinite alternate ease-in-out;
}

@keyframes floatLight {
  from { transform: translate(0,0); }
  to   { transform: translate(-80px, 60px); }
}

/* ----------------------------------------------------
   TABLES (white theming)
---------------------------------------------------- */
.table-wrap {
  overflow-x: auto;
  margin-top: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}

td {
  padding: 1.2rem;
  border-bottom: 1px solid #e5e5e5;
  color: #222;
}

table td:first-child {
  font-weight: 700;
  color: #000;
}

/* ----------------------------------------------------
   FAQ (Black & white)
---------------------------------------------------- */
.faq details {
  margin-bottom: 1rem;
  padding: 1.2rem 1.4rem;
  border-radius: 12px;
  border: 1px solid #ddd;
  background: #fafafa;
  transition: 0.25s ease;
  cursor: pointer;
}

.faq summary {
  font-size: 1.15rem;
  font-weight: 700;
  color: #000;
}

.faq details[open] {
  background: #f0f0f0;
  border-color: #000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* ----------------------------------------------------
   CTA SECTION (soft white gradient)
---------------------------------------------------- */
.cta {
  text-align: center;
  background: linear-gradient(180deg, #ffffff, #f2f2f2);
  color: #000;
  padding: 5rem 1.5rem;
  border-top: 1px solid #e5e5e5;
}

.cta h2 {
  font-size: 2.4rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.1rem;
  opacity: 0.8;
}

.cta-buttons {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn,
.btn-outline {
  padding: 0.9rem 2rem;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  text-decoration: none;
  transition: 0.3s ease;
}

/* Solid button */
.btn {
  background: #000;
  color: #fff;
}

.btn:hover {
  background: #222;
}

/* Outlined button */
.btn-outline {
  border: 2px solid #000;
  color: #000;
}

.btn-outline:hover {
  background: #000;
  color: #fff;
}

/* ----------------------------------------------------
   MOBILE
---------------------------------------------------- */
@media (max-width: 600px) {
  .hero-inner h1 { font-size: 2.2rem; }
  .section-title { font-size: 2rem; }
  .btn, .btn-outline { width: 100%; }
}



RewriteEngine On
Options -Indexes
