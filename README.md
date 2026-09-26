# 🦉 Sabiondo AI — Tutor Académico Inteligente

> Desarrollado por **Daniela Romero** & **Mayra Barrios**.

Sabiondo AI es una plataforma web interactiva diseñada para asistir a estudiantes en su proceso de aprendizaje mediante inteligencia artificial pedagógica, resolución de problemas paso a paso, fórmulas en LaTeX y herramientas de estudio integradas.

---

## ✨ Características Principales

- 🎓 **6 Modos Académicos:** Tutor Integral, Genio STEM (LaTeX), Método Socrático, Asesor de Ensayos (APA 7), Evaluador de Quizzes y Resumidor Flash.
- ⚡ **Respuestas en Tiempo Real (Streaming):** Integración con Groq API (`llama-3.3-70b-versatile`), Google Gemini y OpenRouter.
- ⏱️ **Técnica Pomodoro:** Temporizador de enfoque y descansos con alertas sonoras.
- 🃏 **Flashcards 3D:** Tarjetas de memoria interactivas con giro tridimensional.
- 📝 **Bloc de Notas Rápido:** Toma apuntes y genera resúmenes automáticos.
- 🎙️ **Voz y Dictado:** Entrada de voz mediante Speech Recognition y síntesis de voz en español.
- 📑 **Exportación Markdown:** Descarga tus apuntes y sesiones de estudio con un clic.
- 🌗 **Modos Claro y Oscuro:** Interfaz moderna, minimalista y responsiva.

---

## 🚀 Despliegue en Vercel

1. Importa este repositorio en [Vercel](https://vercel.com).
2. Agrega la variable de entorno:
   - `GROQ_API_KEY`: tu clave de API de Groq
3. Despliega el proyecto.

---

## 💻 Ejecución Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Crea tu archivo `.env`:
   ```env
   GROQ_API_KEY=tu_clave_de_groq
   PORT=3001
   ```

3. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
