# NexStore

NexStore es un proyecto de e-commerce desarrollado con Next.js 15, React 19 y TailwindCSS, que utiliza Prisma y PostgreSQL con Docker en el backend.

## 🚀 Tecnologías utilizadas

- **Next.js 15.1.7** - Framework de React para aplicaciones web modernas.
- **React 19** y **React DOM 19** - Biblioteca para la construcción de interfaces de usuario.
- **Tailwind CSS 3.4.1** - Framework de utilidades para estilos.
- **Framer Motion 12.4.3** - Animaciones fluidas y declarativas.
- **Lucide React 0.475.0** - Conjunto de iconos personalizables.
- **Swiper 11.2.4** - Carruseles y sliders modernos.
- **Prisma** - ORM para la gestión de bases de datos (no incluido en `package.json`, pero parte del stack).
- **PostgreSQL con Docker** - Base de datos utilizada en el backend.

## 📦 Instalación

Asegúrate de tener **Node.js** y **npm** o **yarn** instalados en tu máquina. Luego, clona el repositorio e instala las dependencias:

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nexstore.git
cd nexstore

# Instalar dependencias
npm install  # o yarn install
```

## 🏗️ Scripts disponibles

Puedes ejecutar los siguientes comandos en el proyecto:

- **`npm run dev`** - Inicia el entorno de desarrollo.
- **`npm run build`** - Genera la versión optimizada para producción.
- **`npm run start`** - Ejecuta la aplicación en modo producción.
- **`npm run lint`** - Ejecuta ESLint para analizar el código.

## ⚙️ Configuración adicional

1. **Configuración de Tailwind CSS**
   - Asegúrate de que `tailwind.config.js` y `postcss.config.js` están correctamente configurados.

2. **Base de datos con Docker**
   - Levanta la base de datos con Docker:
     ```bash
     docker-compose up -d
     ```
   - Ejecuta las migraciones de Prisma:
     ```bash
     npx prisma migrate dev
     ```

3. **Variables de entorno**
   - Renombra `.env.example` a `.env` y configura las credenciales necesarias.

## 📂 Estructura del Proyecto

```
my-app/
│── public/          # Archivos estáticos
│── src/
│   ├── app/         # Directorio principal de Next.js (App Router)
│   │   ├── layout.tsx  # Layout global de la app
│   │   ├── page.tsx    # Página principal
│   │   ├── api/        # Rutas API internas
│   │   ├── error.tsx   # Manejo de errores
│   │   ├── not-found.tsx  # Página 404
│   ├── components/    # Componentes reutilizables
│   ├── hooks/         # Hooks personalizados
│   ├── lib/           # Funciones auxiliares y configuración
│   ├── styles/        # Archivos de estilos globales
│── .eslintrc.js       # Configuración de ESLint
│── tailwind.config.js # Configuración de Tailwind CSS
│── tsconfig.json      # Configuración de TypeScript
│── package.json       # Dependencias y scripts
│── README.md          # Documentación del proyecto
```

## 🔧 Comandos Útiles

| Comando         | Descripción                                     |
|----------------|---------------------------------------------|
| `npm run dev`  | Inicia el servidor en modo desarrollo       |
| `npm run build`| Compila la aplicación para producción       |
| `npm run start`| Inicia la aplicación en producción          |
| `npm run lint` | Ejecuta ESLint para corregir errores de código |
| `npm run format` | Formatea el código con Prettier |
