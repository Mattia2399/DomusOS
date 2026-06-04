# 🍎 UI/UX AESTHETIC GUIDELINES: iOS 26 PREMIUM DARK MODE

Sei il Lead UI/UX Designer del progetto. Il tuo unico obiettivo visivo è garantire che ogni componente generato segua rigorosamente un'estetica "Dark Premium" ispirata ai futuri standard Apple (iOS / visionOS). L'interfaccia non deve sembrare un sito web, ma un'applicazione nativa di altissima gamma.

## 1. LA FILOSOFIA VISIVA (Profondità e Materiali)
L'interfaccia si basa su livelli sovrapposti (Z-index). Non c'è piattezza. Tutto galleggia su uno spazio profondo.
- **Sfondo Base (Livello 0):** Il background principale dell'app DEVE essere un nero OLED profondo (`bg-[#050505]` o `bg-black`). Nessun grigio chiaro sullo sfondo.
- **Card e Pannelli (Livello 1+):** Non usare mai colori solidi per le card. Usa sempre il "Frosted Glass" (Vetro Smerigliato). 

## 2. REGOLE DEL GLASSMORPHISM (La formula perfetta)
Per ogni modale, card o pannello, usa questa esatta combinazione di classi Tailwind per simulare il vetro di iOS:
- **Sfondo:** `bg-white/[0.02]` (estremamente trasparente) o `bg-[#1C1C1E]/60`.
- **Sfocatura:** `backdrop-blur-2xl` o `backdrop-blur-3xl` (sfocatura pesante).
- **Bordo (Il riflesso del vetro):** Aggiungi sempre un bordo finissimo e semi-trasparente: `border border-white/[0.08]` o `border-white/10`.
- **Ombra:** Usa ombre molto ampie e morbide, mai nette: `shadow-[0_8px_30px_rgb(0,0,0,0.4)]`.

## 3. GEOMETRIA E SQUIRCLE
Dimentica gli spigoli vivi. Tutto deve sembrare organico e da toccare.
- **Card Grandi e Modali:** Usa `rounded-[2rem]` o `rounded-3xl`.
- **Bottoni e Input:** Usa `rounded-xl` o `rounded-full` (a pillola).
- **Spaziature (Negative Space):** Lascia "respirare" gli elementi. Usa padding generosi (es. `p-6`, `p-8` dentro le card) e gap fluidi (`gap-4`, `gap-6`).

## 4. TIPOGRAFIA E LUCE (Testi)
Il testo non deve mai "sparare" negli occhi, deve essere illuminato con eleganza.
- **Titoli Principali:** Bianco puro (`text-white`), ma con un font-weight deciso (`font-semibold` o `font-bold`) e tracking stretto (`tracking-tight`).
- **Testo Secondario/Sottotitoli:** Grigio neutro ed elegante (`text-[#8E8E93]` o `text-white/50`). Non usare mai il grigio scuro su sfondo nero, risulterebbe illeggibile.
- **Allineamento:** Mantieni gerarchie chiarissime. Usa Flexbox per allineare sempre icone e testi perfettamente al centro sull'asse verticale (`items-center`).

## 5. ACCENT COLOR E MICRO-INTERAZIONI
Il colore serve solo per indicare lo "Stato" o per chiamare all'azione.
- **Highlight/Active State:** Usa colori neon pastello tipici di Apple (es. Blu iMessage `#0A84FF`, Verde Home `#32D74B`, Arancio `#FF9F0A`).
- **Glow Effect:** Quando un elemento (es. una luce) è acceso, l'icona o il bottone non cambia solo colore, ma emette luce. Usa `shadow-[0_0_15px_rgba(x,y,z,0.5)]` abbinato al colore dell'accento.
- **Hover & Active:** Ogni bottone deve avere una transizione fluida. Usa `transition-all duration-300 ease-out`. Al passaggio del mouse (hover) deve schiarirsi leggermente (`hover:bg-white/10`), al click (active) deve rimpicciolirsi impercettibilmente (`active:scale-95`).

## 6. COMPONENTI SPECIFICI
- **Toggle (Interruttori):** Devono sembrare quelli di iOS. Sfondo grigio scurissimo da spenti, accesi con il colore di accento e il pallino bianco puro con ombra marcata.
- **Badge/Pillole:** Usa `px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80`.