export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Método no permitido" });
  }

  const { message } = req.body;

  const apiKeys = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_2, // ← asegúrate de agregar esta en Vercel
    // Puedes agregar más si deseas, como:
    // process.env.OPENAI_API_KEY_3,
  ];

  const openAIRequest = async (apiKey) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Eres una inteligencia artificial especializada en responder preguntas sobre Trabajo Social. No debes mencionar que eres ChatGPT. Si te preguntan qué eres o quién eres, solo responde que eres una IA diseñada para ayudar en temas de Trabajo Social. No debes hablar sobre tus capacidades técnicas ni sobre otros temas que no estén relacionados con el Trabajo Social.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();
    return { response, data };
  };

  try {
    let finalData = null;
    for (const key of apiKeys) {
      try {
        const { response, data } = await openAIRequest(key);

        // ✅ Log para depuración
        console.log("Respuesta de OpenAI:", data);

        if (response.ok && data.choices && data.choices[0]) {
          finalData = data.choices[0].message.content;
          break; // ✅ Salimos del bucle al obtener una respuesta válida
        } else {
          console.warn("Clave falló:", key, data);
        }
      } catch (err) {
        console.warn("Error con clave:", key, err);
      }
    }

    if (finalData) {
      return res.status(200).json({ result: finalData });
    } else {
      throw new Error("Todas las claves fallaron");
    }

  } catch (error) {
    console.error("Error al llamar a OpenAI:", error);
    return res.status(500).json({
      result:
        "🤖 La IA está ocupada o fuera de servicio por el momento. Intenta nuevamente más tarde.",
    });
  }
}
