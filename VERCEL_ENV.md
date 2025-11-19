# Instrucciones para variables de entorno en Vercel (Next.js)

Para que la variable `NEXT_PUBLIC_API_BASE_URL` funcione correctamente en producción y durante el build en Vercel, sigue estos pasos:

1. Ingresa a tu proyecto en Vercel: https://vercel.com/dashboard
2. Ve a **Settings** > **Environment Variables**.
3. Haz clic en **Add** para crear una nueva variable:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://api.tourealo.com/api`
   - **Environment**: Selecciona `Production` (y también `Preview` si quieres que funcione en previews)
4. Guarda los cambios.
5. Vuelve a desplegar el proyecto (Deploy).

> Nota: Las variables en archivos `.env` locales **no** se usan automáticamente en Vercel. Deben estar definidas en el panel de Vercel para que estén disponibles en el build y en runtime.

---

**Resumen:**
- Si no defines la variable en Vercel, el frontend usará el valor por defecto o fallará.
- Defínela siempre en el panel de Vercel para builds y producción.
